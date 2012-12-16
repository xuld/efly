/**
 * @class jsxdev.NodeJSThread
 * @extends jsxdev.Thread
 * @createTime 2012-03-08
 * @updateTime 2012-03-08
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('jsxdev/Util.js');
include('jsxdev/Thread.js');
include('node/child_process.js');
include('jsxdev/NodeJSClient.js');

define(function() {
    var child_process = node.child_process;
    var Util = jsxdev.Util;
    var WIN_PLATFORM = /^win(32|64)/i.test(process.platform);
    var INSTANCE = [];
    
    process.on('exit', function(){
        INSTANCE.forEach(exit);
    });

    function exit(_this) {
        var _process = _this._process;
        
        if (!_process){
            return;
        }
        _this._process = null;

        // kill child process
        _process.kill(/*SIGKILL -9*/);

        nextTick(Util.kill, _this.opt.username);
    }

    function init(_this) {
        //--debug-brk=8000
        //node --debug=8000 /home/louis/server/Jsx/Jsx.js jsxdev/main --debug

        var _process;
        var opt = _this.opt;
        var username = opt.username;
        var env = Jsx.extend({}, process.env);
        
        env.ENABLE_
        env.WEB_SERVER_GLOBAL_AUTH_ID = opt.globalAuthId;
        env.WEB_SERVER_GLOBAL_AUTH_URL = opt.globalAuthUrl;
        env.JSX_DEBUG_CLIENT_SERVICE = opt.debugService;
        env.WEB_SERVER_PORT = opt.port[1];

        var args = [username, '-c'];
        var cmd = ['umask', '007', ';', 'node', opt.framework, opt.startup];
        if(opt.debug){
            //args.unshift();
            cmd.splice(4, 0, '--debug-brk=' + opt.port[0]);
            cmd.push('--debug');
        }
        args.push(cmd.join(' '));

        try {
            _this._process = 
            _process = child_process.spawn('su', args, { env: env });
            
        } catch (err) {
            return nextTick(function() {
                _this.onstderr.emit(err.message);
                _this.onexit.emit();
            });
        }
        
        _process.on('exit', function(){
            _this._process = null;
            _this._client = null;
            
            Util.kill(username);
            //emit close event
            _this.onexit.emit();
            INSTANCE.removeVal(_this);
        });

        _process.stdout.on('data', function(buff) {
            //emit stdout event
            _this.onstdout.emit(buff + '');
        });

        _process.stderr.on('data', function(buff) {
            //emit stderr event
            _this.onstderr.emit(buff + '');
        });
        
        INSTANCE.push(_this);

        if (!opt.debug)
            return;

        var client = new jsxdev.NodeJSClient();
        _this._client = client;

        client.on('ready', function() {

            _this.setAllBreakpoints(_this.breakpoints, function(err) {
                if (err)
                    return _this.exit();
                
                if(_this._client){
                    _this.cont();
                    _this.onready.emit();
                }
            });
        });

        client.on('break', function(e) {
            _this.isBreak = true;

            var root = _this.rootPath;
            var script = e.body.script;
            if(!script.name)
                script.name = '[eval_code]';
            var name = Jsx.format(script.name);

            script.name =
            (name.indexOf(root) == -1 ?
                'native' + '/' + name.match(/[^\/]+$/)[0] : name.replace(root, ''));

            var exps = _this.watchsExp.concat();
            if (exps.length) {
                _this.watchs(exps, function(err, data) {
                    e.watchsExp = data || [];
                    _this.onbreak.emit(e);
                });
            }
            else {
                e.watchsExp = [];
                _this.onbreak.emit(e);
            }
        });

        //TODO ?
        //onerrorbreak ??

        client.on('close', function() {
            exit.delay(500, _this);
        });

        var connectionAttempts = 0;
        client.on('error', connectError);

        function connectError() {
            // If it's failed to connect 4 times then don't catch the next error
            if (connectionAttempts > 10)
                return exit(_this);
            attemptConnect.delay(500);
        }

        function attemptConnect() {
            ++connectionAttempts;
            client.connect(opt.port[0]);
        }

        attemptConnect.delay(500);
    }

    function watch(_this, exp, cb) {

        exp = exp.replace(/"/g, '\\"');
        _this._client.watch('Jsx._Debug.watch(eval("' + exp + '"));', function(err, data) {

            var res = err ? { value: err, type: 'Error'} : JSON.parse(data.value);
            res.expression = exp;
            cb(null, res);
        });
    }

    Class('jsxdev.NodeJSThread', jsxdev.Thread, {

        //private:
        _client: null,
        _process: null,

        //public:
        name: 'Server NodeJS',

        /**
         * constructor
         * @param {Object}   opt
         * @param {String[]} watchs
         * @constructor
         */
        NodeJSThread: function(opt) {
            this.Thread(opt);
            init(this);
        },

        //overlay
        eval: function(expression, cb) {
            this._client.eval(expression, cb);
        },

        //overlay
        watchs: function(expressions, cb) {

            var result = [];
            var _this = this;
            var exp;

            function handler(err, data) {
                if (err)
                    return cb(err);
                if (data)
                    result.push(data);

                if (!expressions.length)
                    return cb(null, result);

                exp = expressions.shift();
                watch(_this, exp, handler);
            }
            handler();
        },

        //overlay
        setBreakpoints: function(name, breakpoints, cb) {
            this._client.setBreakpoints(this.rootPath + name, breakpoints, cb);
        },

        //overlay
        setAllBreakpoints: function(breakpoints, cb) {
            var _this = this;

            nextTick(function() {
                if (!breakpoints.length)
                    return cb();

                var breakpoint = breakpoints.shift();
                var ls = breakpoint.breakpoints;
                if (!ls.length)
                    return arguments.callee();
                var name = _this.rootPath + breakpoint.name;

                if (WIN_PLATFORM && /server\/Jsx\/Jsx.js/i.test(name))
                    name = name.replace(/\//g, '\\');
                    
                var client = _this._client;
                    
                if(client){
                    client.setBreakpoints(name, ls, arguments.callee.cb(cb));
                }
                else{
                    cb('error connect close');
                }
            });
        },

        //overlay
        clearBreakpoints: function(name, breakpoints, cb) {
            this._client.clearBreakpoints(this.rootPath + name, breakpoints, cb);
        },

        //overlay
        clearAllBreakpoints: function(cb) {
            this._client.clearAllBreakpoints(cb);
        },

        //overlay
        cont: function(cb) {
            this.isBreak = false;
            this._client.cont(cb);
        },

        //overlay
        next: function(cb) {
            this.isBreak = false;
            this._client.next(cb);
        },

        //overlay
        step: function(cb) {
            this.isBreak = false;
            this._client.step(cb);
        },

        //overlay
        out: function(cb) {
            this.isBreak = false;
            this._client.out(cb);
        },

        //overlay
        exit: function() {
            exit(this);
        },
        
        /**
         * 更新代码版本
         */
        updateCodeVersion: function() {
            var client = this._client;
            if(client) {
                client.updateCodeVersion();
            }
        }

    });
});