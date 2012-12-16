/**
 * @class jsxdev.Debug
 * @extends Jsx.web.Service.WSService
 * @createTime 2012-01-23
 * @updateTime 2012-01-23
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/Delegate.js');
include('Jsx/Config.js');
include('Jsx/web/service/WSService.js');
include('jsxdev/service/User.js');
include('jsxdev/service/Project.js');
include('jsxdev/service/IDE.js');
include('jsxdev/Settings.js');
include('jsxdev/FileMap.js');
include('jsxdev/Util.js');
include('jsxdev/NodeJSThread.js');
include('jsxdev/BrowserThread.js');

define(function() {
    var Util = jsxdev.Util;
    var Project = jsxdev.service.Project;
    var Settings = jsxdev.Settings;
    var FileMap = jsxdev.FileMap;
    var User = jsxdev.service.User;
    var WIN_PLATFORM = /^win(32|64)/i.test(process.platform);

    function getAbsolutePath(_this, path) {

        var node = _this.node;
        var rootbasedir = _this.tree.basedir;
        var basedir = node.basedir;
        
        var rootdor = Project.getRootdir(_this.server.workspace, rootbasedir);
        var trunk = 'trunk/' + rootbasedir;
        var branchs = 'branchs/' + basedir;
        var tags = 'tags/' + basedir;
        
        var target = rootdor +
            (node.tag ? tags : node.top === null ? trunk : branchs) + '/' + (path || '');
        return target;
    }

    function addThread(_this, thread, type) {
        var id = thread.id;
        var threads = _this.threads;
        
        threads[id] = thread;
        thread.onready.on(function() {
            _this.onready.emit({ threadId: id, type: type, name: thread.name });
        });

        thread.onbreak.on(function(e) {
            var data = e.data;
            data.threadId = id;
            _this.onbreak.emit(data);
        });

        thread.onerrorbreak.on(function(e) {
            var data = e.data;
            data.threadId = id;
            _this.onbreak.emit(data);
        });

        thread.onstdout.on(function(e) {
            _this.onstdout.emit({ threadId: id, body: e.data });
        });

        thread.onstderr.on(function(e) {
            _this.onstderr.emit({ threadId: id, body: e.data });
        });

        thread.onexit.on(function() {
            delete threads[id];
            _this.onexit.emit({ threadId: id });
        });
    }

    function getThread(_this, id, cb) {

        var thread = _this.threads[id];
        if (thread)
            return thread;

        cb(new Error('Can not find the Thread'));
    }

    function _continue(_this, name, id) {

        function cb(err) {
            if (err)
                _this.onerror.emit(err);
        }
        var thread = getThread(_this, id, cb);
        if (thread)
            thread[name](cb);
    }

    function changebreakpoints(_this, evt) {

        var data = evt.data;
        var name = data.name;
        var row = data.row;
        var action = data.action;
        var mainThread = _this._mainThread;
        var threads = _this.threads;

        //TODO breakpoint
        //?
        if (data.type == 'server') {

            if (mainThread){
                (action == 'set') ?
                    mainThread.setBreakpoints(name, [row]) :
                    mainThread.clearBreakpoints(name, [row]);
            }
            return;
        }
        else if(data.type == 'client'){
            
            for (var i in threads) {
                var thread = threads[i];
                
                if(action == 'clearAll'){
                    thread.clearAllBreakpoints();
                    continue;
                }
    
                if (mainThread === thread)
                    continue;
                if(action == 'set')
                    thread.setBreakpoints(name, [row]);
                else
                    thread.clearBreakpoints(name, [row]);
            }
        }
    }
    
    function updateCodeVersion(_this){

        var mainThread = _this._mainThread;
        if(mainThread)
            mainThread.updateCodeVersion();
    }

    function setWatchsExp(_this) {
        var threads = _this.threads;
        var watchs = Jsx.keys(_this._watchsExp);

        for (var i in threads) {
            var thread = threads[i];
            thread.watchsExp = watchs;
        }
    }
    
    Class('jsxdev.Debug', Jsx.web.service.WSService, {

        _watchsExp: null,
        _mainThread: null,

        //public:
        globalAuthId: 0,
        
        /**
         * @type {Number[]}
         */
        port: null,

        /**
         * @type {jsxdev.Thread}
         */
        threads: null,

        /**
         * @type {Boolean}
         */
        debug: false,

        /**
         * @type {Boolean}
         */        
        get startup() { 
            return !!this._mainThread;
        },

        /**
         * current open node
         * @type {Number}
         */
        id: 0,

        /**
         * current login user object
         * @type {Object}
         */
        user: null,

        /**
         * current open of project 
         * @type {jsxdev.ProjectTree}
         */
        tree: null,
        
        /**
         * current open of project node
         * @type {jsxdev.TreeNode}
         */
        node: null,

        /**
         * @type {String}
         */
        rootPath: '',

        /**
        * @event onready
        */
        onready: null,

        /**
        * @event onbreak
        */
        onbreak: null,

        /**
        * @event onerrorbreak
        */
        onerrorbreak: null,

        /**
        * @event onstdout
        */
        onstdout: null,

        /**
        * @event onstderr
        */
        onstderr: null,

        /**
        * @event onexit
        */
        onexit: null,

        /**
        * @event onstop
        */
        onserverstop: null,

        /**
        * constructor function
        * @constructor
        */
        Debug: function() {
            //definr event
            Jsx.Delegate.def(this, 'ready', 'break', 'errorbreak', 'stdout', 'stderr', 'exit', 'serverstop');
            this.threads = {};
            this._watchsExp = {};
            this.globalAuthId = Jsx.guid();
        },

        //overlay
        auth: function(cb) {
            var _this = this;

            //is login
            User.getLoginUser(this.session.get(User.SESSION_TOKEN_NAEM), function(err, user) {

                if (!user)
                    return cb(null, false);

                var info = _this.session.get(jsxdev.service.Project.OPEN_NODE_SESSION_NAME);
                if (!info)
                    return cb(null, false);

                _this.user = user;
                _this.id = info.id;
                _this.tree = info.tree;
                _this.node = info.tree.find(info.id);
                _this.rootPath = getAbsolutePath(_this);

                var settings;
                var filemap;
                function bind(){
                    
                    settings = Settings.get(_this.rootPath);
                    filemap = FileMap.get(_this.rootPath);
                    
                    settings.ondestroy.on(bind);
                    settings.onchangebreakpoints.$on(changebreakpoints, _this);
                    filemap.ondestroy.on(bind);
                    filemap.onchange.$on(updateCodeVersion, _this);
                }
                bind();

                _this.conversation.onclose.on(function() {
                    _this.stop();
                    settings.ondestroy.unon(bind);
                    settings.onchangebreakpoints.unon(changebreakpoints, _this);
                    filemap.ondestroy.unon(bind);
                    filemap.onchange.unon(updateCodeVersion, _this);
                    //清理用户
                    Util.clearUser(user.alias);
                });
                
                //添加用户,加入文件组
                Util.closeConnect(user.alias);
                Util.useradd.delay(200, user.alias, _this.id, function(err){
                    cb(null, !err);
                });
            });
        },

        /**
        * start server
        * @param {Function} cb
        */
        start: function(debug, cb) {
            if(this.node.weight > 1)
                return cb('Insufficient permissions');
            
            if (this._mainThread)
                return cb('Service has been launched');

            //需要启动项
            var startup = Settings.get(this.rootPath).get('startup');
            if (!startup)
                return cb('App no startup item');

            var port = Util.ports(this.user.alias);
            var headers = this.request.headers;
            var src = 'http://' + headers.host + this.server.virtual;
            if (!port)
                return cb('There is no available TCP port');

            var auth = this.globalAuthId;
            var token = this.conversation.token;
            var opt = {
                rootPath: this.rootPath,
                watchsExp: Jsx.keys(this._watchsExp),
                breakpoints: Settings.get(this.rootPath).getAllBreakpoints().server,
                port: port,
                debug: debug,
                framework: this.rootPath + 'server/Jsx/Core.js',
                startup: startup.match(/^server\/(.+\.js)$/i)[1],
                globalAuthId: auth,
                globalAuthUrl: src + '/debugAuth/' + token + '/',
                debugService: src + '/?auth=' + auth + '&token=' + token,
                username: this.user.alias,
                node_id: this.id
            };

            var _this = this;
            var mainThread = new jsxdev.NodeJSThread(opt);

            mainThread.onexit.on(function() {
                var threads = _this.threads;
                delete threads[mainThread.id];

                _this._mainThread = null;

                for (var i in threads)
                    threads[i].exit();
                _this.threads = {};

                var de = _this.onserverstop;
                nextTick(de, de.emit)
            });

            this.debug = debug;
            this.port = port;
            this._mainThread = mainThread;
            addThread(this, mainThread, 'server');

            cb(null, port);
        },

        /**
        * 创建浏览器线程
        * @reutrn {jsxdev.Thread}
        */
        newBrowserThread: function() {
            var opt = {
                username: this.user.alias,
                rootPath: this.rootPath, 
                watchsExp: Jsx.keys(this._watchsExp),
                breakpoints: Settings.get(this.rootPath).getAllBreakpoints().client,
            };
            var thread = new jsxdev.BrowserThread(opt);
            
            addThread(this, thread, 'client');
            return thread;
        },

        /**
        * stop debug all
        */
        stop: function() {
            //TODO
            var thread = this._mainThread;
            if (thread)
                thread.exit();
        },

        /**
        * restart
        * @param {Function} cb
        */
        restart: function(cb) {
            this.onserverstop.once(function() {
                this.start.delay(this, 500, true, cb);
            });

            this.stop();
        },

        /**
        * eval
        * @param {Number}   id thread id
        * @param {String}   exp
        * @param {Function} cb
        */
        eval: function(id, exp, cb) {
            var thread = getThread(this, id, cb);
            if (thread)
                thread.eval(exp, cb);
        },

        /**
        * cont
        * @param {Number}   id thread id
        */
        cont: function(id) {
            _continue(this, 'cont', id);
        },

        /**
        * next 
        * @param {Number}   id thread id
        */
        next: function(id) {
            _continue(this, 'next', id);
        },

        /**
        * step
        * @param {Number}   id thread id
        */
        step: function(id) {
            _continue(this, 'step', id);
        },

        /**
        * out
        * @param {Number}   id thread id
        */
        out: function(id, cb) {
            _continue(this, 'out', id);
        },

        /**
        * add watchs
        * @param {String}   exps
        */
        addWatchsExp: function(exps) {
            var _this = this;
            exps.forEach(function(exp) {
                _this._watchsExp[exp] = true;
            });
            setWatchsExp(this);
        },

        /**
        * un watchs
        * @param {String} exps
        */
        unWatchsExp: function(exps) {
            var _this = this;
            exps.forEach(function(exp) {
                delete _this._watchsExp[exp];
            });
            setWatchsExp(this);
        },

        /**
        * update watchs
        * @param {String} removes
        * @param {String} adds
        */
        updateWatchsExp: function(removes, adds) {
            this.unWatchsExp(removes);
            this.addWatchsExp(adds);
        },

        /**
        * get all watch by thread
        * @param {Number}       id   thread id
        * @param {String[]}     exps
        * @param {Function}     cb
        */
        watchs: function(id, exps, cb) {

            if (typeof exps == 'function') {
                cb = exps;
                exps = Jsx.keys(this._watchsExp);
            }

            var thread = getThread(this, id, cb);
            if (thread)
                thread.watchs(exps, cb);
        }
    });

});
