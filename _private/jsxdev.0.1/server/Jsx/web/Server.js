/**
 * @class Jsx.web.Server 服务器
 * @extends http.Server
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Config.js');
include('Jsx/Delegate.js');
include('Jsx/web/Router.js');
include('Jsx/web/service/conversation/WebSocket.js');
include('Jsx/web/service/StaticService.js');
include('Jsx/web/service/WSService.js');
include('node/http.js');
include('node/fsx.js');

define(function() {
    var http = node.http;
    var Config = Jsx.Config;
    var ENV = process.env;
    var INSTANCE;
    var MIME_TYPES = {};

    var setHttpDebug = function(){return false}
    var setSocketDebug = setHttpDebug;
    if(Jsx._Debug){
        setHttpDebug = Jsx._Debug.setHttpDebug;
        setSocketDebug = Jsx._Debug.setSocketDebug;
    }

    var mime = Config.readHash('Jsx/web/mime/mime.types');
    mime = Jsx.extend(mime, Config.readHash('Jsx/web/mime/node.types'));
    mime = Jsx.extend(mime, Config.readHash('Jsx/web/mime/Jsx.types'));

    for (var type in mime) {

        var keys = mime[type].split(/\s+/);
        for (var j = 0, key; (key = keys[j]); j++)
            MIME_TYPES[key] = type;
    }

    if (!Jsx.DEBUG) {
        //只有在非调试时
        //error
        Jsx.onerror = function(err) {
            console.error(err);
            console.error(err.stack);
        };
    }

    //Handle http and websocket and http-heartbeat request
    function _init(_this) {

        //http
        _this.on('request', function(req, res) {

            //设置http client deubg
            if(setHttpDebug(_this, req, res)){
                return;
            }

            var info = _this.router.get(req.url);
            var name = info.service;
            var filename = name.replace(/\./g, '/') + '.js';
            var data = [];
            var end = false;

            req.pause();
            req.on('data', function(buff) { data.push(buff) });
            req.once('end', function() { end = true });

            //inner include
            include(filename, function(err) {
                req.removeAllListeners('data');

                var StaticService = Jsx.web.service.StaticService;
                var klass = err ? StaticService: Jsx.get(name) || StaticService;

                if (!Jsx.equals(klass, StaticService)) {
                    console.error(name + ' not the correct type, http request');
                    klass = StaticService;
                }
                var service = new klass();

                service.init(req, res);
                service.auth(function(err, e) {

                    if (!e) {
                        return req.socket.destroy.delay(req.socket, 10);
                    }
                    req.resume();
                    service.action(info);

                    for (var i = 0, l = data.length; i < l; i++){
                        req.emit('data', data[i]);
                    }
                    if (end){
                        req.emit('end');
                    }
                }, info.action);
            });
        });

        // upgrade websocket
        _this.on('upgrade', function(req, socket, upgradeHead) {

            //设置 socket debug
            if(setSocketDebug(_this, req, socket)){
                return;
            }

            var info = _this.router.get(req.url);
            var name = info.service;
            var filename = name.replace(/\./g, '/') + '.js';

            //inner include
            include(filename, function(err) {

                var WSService = Jsx.web.service.WSService;
                var klass = Jsx.get(name);

                if (err || !klass) {
                    console.error('no define "' + name + '" type, web socket');
                    return socket.end();
                }
                if (!Jsx.equals(klass, WSService)) {
                    console.error('"' + name + '" not the correct type, web socket');
                    return socket.end();
                }

                Jsx.web.service.conversation.WebSocket.create(req, upgradeHead)
                .setService(new klass());
            });

        });
    }

    Class('Jsx.web.Server', http.Server, {

        //public:
        /**
         * 侦听主机IP
         * @type {String}
         */
        host: '',

        /**
         * 侦听端口
         * @type {Number}
         */
        port: 80,

        /**
         * session timeout default 15 minutes
         * @type {Number}
         */
        session: 15,

        /**
         * 站点根目录
         * @type {String}
         */
        root: Jsx.format('../client'),

        /**
         * 临时目录
         * @type {String}
         */
        temp: Jsx.format('../temp/'),

        /**
         * 站点虚拟目录
         * @type {String}
         */
        virtual: '',

        /**
         * web socket conversation verify origins
         * @type {String[]}
         */
        origins: null,

        /**
         * 是否浏览静态文件目录
         * @type {Boolean}
         */
        dirRead: false,

        /**
         * 静态缓存文件过期时间,以天为单位
         * @type {Number}
         */
        expires: 1e6,

        /**
         * 静态文件缓存,该值可减低硬盘静态文件读取次数,但需要消耗内存,单位(秒)
         * @type {Number}
         */
        fileCacheTime: 6,

        /**
         * File size limit
         * @type {Number}
         */
        maxFileSize: 5 * 1024 * 1024,

        /**
         * 请求超时时间
         * @type {Number}
         */
        timeout: 120,

        /**
         * 静态gzip文件格式
         * defaults javascript|text|json|xml
         * @type {Regexp}
         */
        gzip: null,

        /**
         * 是否动态内容压缩
         * @type {Boolean}
         */
        agzip: true,

        /**
         * 默认页
         * @type {String[]}
         */
        defaults: null,

        /**
         * 禁用目录
         * @type {RegExp}
         */
        disable: null,

        /**
         * 错误状态页
         * @type {Object}
         */
        errorStatus: null,

        /**
         * mime types
         * @type {Object}
         */
        mimeTypes: null,

        /**
         * 路由器
         * @type {Jsx.web.Router}
         */
        router: null,

        /**
         * 构造函数
         * @constructor
         * @param {Object} opt (Optional) 配置项
         */
        Server: function(opt) {
            http.Server.call(this);

            this.gzip = /javascript|text|json|xml/i;
            this.errorStatus = {};
            this.disable = /^\/server/i;
            this.defaults = [];
            this.mimeTypes = {};
            this.origins = ['*:*'];
            this.router = new Jsx.web.Router();

            this.setting(opt || {});
            _init(this);
        },

        /**
         * 设置服务器
         * @param {Object} conf 配置项
         */
        setting: function(conf) {

            Jsx.update(this, Jsx.filter(conf, [
                'host',
                'dirRead',
                'mimeTypes',
                'errorStatus',
                'agzip',
                'origins',
                'port',
                'fileCacheTime',
                'expires',
                'timeout',
                'session',
                'maxFileSize'
            ]));

            var defaults = conf.defaults;
            var disable = conf.disable ? '|' + (conf.disable + '').replace(/\s+/, '|') : '';
            var root = conf.root;
            var temp = conf.temp;
            var virtual = conf.virtual;
            var gzip = conf.gzip;

            this.port = parseInt(ENV.WEB_SERVER_PORT) || this.port;
            this.defaults = defaults ? (defaults + '').split(/\s+/) : [];
            this.disable = new RegExp('^(/server' + disable + ')', 'i');
            this.root = root ? Jsx.format(root + '').replace(/\/$/, '') : this.root;
            this.temp = temp ? Jsx.format(temp + '').replace(/\/?$/, '/') : this.temp;
            this.virtual = virtual ? (virtual + '').replace(/^(\/|\\)*([^\/\\]+)/, '/$2') : this.virtual;

            this.gzip =
            new RegExp('javascript|text|json|xml' +
            (gzip ? ('|' + gzip).trim().replace(/\s+/, '|') : ''), 'i');

            node.fsx.mkdir(this.temp);
            this.router.setting({
                staticService: conf.staticService,
                virtual: this.virtual,
                router: conf.router
            });

        },

        /**
         * MIME 获取类型
         * @param {String}   ename  扩展名或文件名称
         * @return {String}
         */
        getMIME: function(name) {

            var mat = name.match(/\.([^$\?\/\\\.]+)((#|\?).+)?$/);
            if (mat) {
                name = mat[1];
            }

            name = name.toLowerCase();
            return this.mimeTypes[name] || MIME_TYPES[name] || 'application/octet-stream';
        },

        /**
         * 启动服务
         */
        start: function() {

            if (this.port) {
                this.listen(this.port, this.host);
            }
            else {
                this.listen();
                var addr = this.address();
                this.host = addr.address;
                this.port = addr.port;
            }
        },

        /**
         * 停止服务
         */
        stop: function() {
            this.close();
        }
    },
    {
        /**
         * get default web server
         * @return {Jsx.web.Server}
         * @static
         */
        get: function() {

            if (!INSTANCE) {
                INSTANCE = new Jsx.web.Server(Jsx.Config.get('server'));
            }
            return INSTANCE;
        }
    });

});