/**
 * @class Jsx
 * @createTime 2011-11-02
 * @updateTime 2011-11-02
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

(function(global, EVAL) {

    //定义全局
    function _DEFINE_GLOBAL(global, EVAL) {

        global.root = global.global = global.GLOBAL = global;
        global.EVAL = EVAL;

        //清空字符串中的空格
        function empty(string) {
            return string.replace(/\s+/g, '');
        }

        /**
         * 抛出异常
         * @method throwError
         * @param {Object}   err
         * @param {Function} cb  (Optional) 异步回调错误
         * @static
         */
        function throwError(err, cb) {
            var error = 
                err instanceof Error && !Jsx.UA.TRIDENT ? err :
                typeof err == 'string' ? new Error(err) : 
                Jsx.extend(new Error(err.message || 'error'), err);
            if (cb)
                nextTick(cb, error);
            else
                throw error;
        }

        /**
         * next Tick exec
         * @method nextTick
         * @param {Object}   _this (Optional) 
         * @param {Function} cb               callback function
         * @param {Object}   argus (Optional) params
         * @static
         */
        function nextTick(cb) {
            var _this = null;
            var args = Array.prototype.slice.call(arguments, 1);

            if (typeof cb != 'function') {
                _this = cb;
                cb = args.shift();
            }
            if (typeof cb != 'function')
                throw 'arguments error';

            setTimeout(function() {
                cb.apply(_this, args);
            }, 0);
        }

        /**
         * 定义应用程序
         * @method define
         * @param {Function} def 应用程序定义
         * @param {Object}   b   (Optional)
         * @param {Object}   c   (Optional)
         * @static
         */
        function define(def, b, c) {
            if (typeof def == 'function')
                return def(global);
            _INCLUDE_LOG[def] = { includes: b, codes: ['define(' + c + ');'] };
            c(global);
        }

        /**
         * 定义一个需要实现的虚函数
         * @type {Function}
         */
        //virtual
        function virtual() {
            throw 'Need to implement virtual functions';
        }

        var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
        var defineProperty = Object.defineProperty;
        var lookup = global.__lookupSetter__;

        var getMemberType = lookup ? function(obj, name) {

            //返回成员信息,0为普通字段,1为属性访问器,2为函数,3为不存在
            var property;
            var type = 3;
            var value;

            if (name in obj) {
                var g = obj.__lookupGetter__(name);
                var s = obj.__lookupSetter__(name);

                if (g || s) {
                    property = { get: g, set: s };
                    type = 1;
                }
                else {
                    value = obj[name];
                    type = (typeof value == 'function' ? 2 : 0);
                }
            }
            return { property: property, value: value, type: type };

        } : getOwnPropertyDescriptor ? function(obj, name) {

            var property = getOwnPropertyDescriptor(obj, name);
            var type = 3;
            var value;

            if (property) {
                if (property.writable) {
                    value = property.value;
                    type = (typeof value == 'function' ? 2 : 0);
                }

                else //属性访问器
                    type = 1;
            }
            return { property: property, value: value, type: type };

        } : function(obj, name) {

            var type = 3;
            var value;

            if (name in obj) {

                value = obj[name];
                type = (typeof value == 'function' ? 2 : 0);
            }
            return { value: value, type: type };
        };

        //get base member type info
        var getBaseMemberType = 
        !lookup && getOwnPropertyDescriptor ? function(obj, name, klass) {

            var property;
            var type = 3;
            var value;
            var base;

            if (name in obj) {
                while (base = klass.__base__) {

                    var __prot__ = base.__prot__;
                    if (__prot__ && 
                        (property = getOwnPropertyDescriptor(__prot__, name))) {

                        if (property.writable) {
                            value = property.value;
                            type = (typeof value == 'function' ? 2 : 0);
                        }
                        else
                            type = 1;
                        break;
                    }
                    klass = base;
                }
            }
            return { property: property, value: value, type: type };
        } : getMemberType;

        //inherit constructor
        function _constructor() { }
        var _err = ': rewrite type mismatch';

        /**
         * 声明类型
         * @method _class
         * @param  {String} name 类型的完整名称,名称以private开头表示似有类型
         * @param  {Class} bases 基类型
         * @param  {Object} members 类成员(javascript键值对)
         * @param  {Object} staticMembers 静态成员(javascript键值对)
         * @return {Class}
         * @static
         */
        function _class(name, base, members, staticMembers) {

            var e;
            var klass;
            var _this = global;
            var names = empty(name).split('.');
            var klassName = names.pop();

            if (members && (klass = members[klassName]) !== undefined) {
                if (typeof klass != 'function')
                    throw name + ' must be a constructor';
            }
            else
                klass = new Function();
            klass.__name__ = name;
            klass.__base__ = base;
            klass.__prot__ = members;

            //inherit base
            if (base) {
                _constructor.prototype = base.prototype;
                klass.prototype = new _constructor();
                klass.prototype.constructor = klass;
            }

            var prototype = klass.prototype;
            for (var key in members) {

                var baseProperty = getBaseMemberType(prototype, key, klass);
                var property = getMemberType(members, key);
                var basetype = baseProperty.type;
                var type = property.type;
                var value = property.value;

                switch (type) {
                    case 0: //普通字段

                        if (basetype === 3 || basetype === 0) {
                            if (typeof value == 'object' && value)
                                throw name + '.' + key + ': can not be object type ';
                            prototype[key] = value;
                        }
                        else
                            throw name + '.' + key + _err;
                        break;

                    case 1: //属性访问器

                        if (basetype !== 2) {

                            property = property.property;
                            if (basetype == 1) {

                                baseProperty = baseProperty.property;
                                property.get = property.get || baseProperty.get;
                                property.set = property.set || baseProperty.set;
                            }
                            defineProperty(prototype, key, property);
                        }
                        else
                            throw name + '.' + key + _err;
                        break;

                    case 2: //函数
                        if (basetype === 3 || basetype === 2) {

                            if (basetype == 2) { //需重写基类成员

                                var baseValue = baseProperty.value;
                                var __belongs__ = baseValue.__belongs__;
                                if (__belongs__)
                                    prototype[__belongs__.__name__.replace(/\./g, '_') + 
                                        '_' + key] = baseValue;
                            }

                            value.__belongs__ = klass;
                            prototype[key] = value;
                        }
                        else
                            throw name + '.' + key + _err;
                        break;
                }
            }
            Jsx.extend(klass, staticMembers);

            while (e = names.shift())
                _this = _this[e] || (_this[e] = {});

            if (klassName in _this)
                throw name + ': repeat the definition of';

            if (!klassName.match(/^private/))
                _this[klassName] = klass;
            return klass;
        }

        /**
         * 声明枚举类型
         * @method _enum
         * @param {String} name 枚举类型的完整名称
         * @param {Object} members 成员(javascript键值对)
         * @return {enumerate}
         * @static
         */
        function _enum(name, members) {

            var e;
            var names = empty(name).split('.');
            var enumName = names.pop();
            var obj = [];
            var _this = global;

            while (e = names.shift())
                _this = _this[e] || (_this[e] = {});

            for (var i in members) {
                var val = members[i];
                obj[i] = val;
                obj[val] = i;
            }

            if (enumName in _this)
                throw name + ': repeat the definition of';

            _this[enumName] = obj;
            return obj;
        }

        function noop() { }

        function on(_this, type, handler) {
            if (_this.addEventListener)
                return _this.addEventListener(type, handler, false);

            if (_this.attachEvent) {
                var wrapper = function() {
                    handler(global.event);
                };
                handler._wrapper = wrapper;
                _this.attachEvent('on' + type, wrapper);
            }
        }

        function unon(_this, type, handler) {
            if (_this.removeEventListener)
                return _this.removeEventListener(type, handler, false);

            if (_this.detachEvent)
                _this.detachEvent('on' + type, handler._wrapper || handler);
        }

        function def_vx(o, u, s) {
            for (var name in u) {
                var item = u[name];
                if (name in o && item.override != 'yes')
                    throw name + s + '重复定义,覆盖请声明override=yes';
                o[name] = u[name];
            }
        }

        var _FORMAT_REG = [
            /\\/g,
            /\/\.\//g,
            /^(\/)|((https?|wss?):\/\/)/i,
            /((https?|wss?):\/)?\/[^\/]+\/\.{2,}/i,
            /\.+\//g
        ];

        var _XHRS = {};
        var _UNLOAD = false;

        on(global, 'unload', function() {
            _UNLOAD = true;
            for (var i in _XHRS)
                _XHRS[i].abort();
        });

        var Jsx = {

            /**
             * 当前时区
             * @type {Number}
             * @static
             */
            TIMEZONE: new Date().getTimezoneOffset() / -60,

            /**
             * 应用程序开发调试(未发布状态)
             * @type {Boolean}
             * @static
             */
            DEBUG: true,

            /**
             * 格式化路径
             * @param  {String}  path 路径
             * @return {String}  返回完整路径
             * @static
             */
            format: function(path) {

                path = path.replace(_FORMAT_REG[0], '/').replace(_FORMAT_REG[1], '/');
                var m = path.match(_FORMAT_REG[2]);
                path = 
                (m ? m[1] ? Jsx.ROOT_DIR + path.substr(1) : path : Jsx.APP_DIR + path);

                var reg = _FORMAT_REG[3];
                while (m = path.match(reg)) {

                    if (m[1])
                        break;
                    var index = m.index;
                    path = path.substring(0, index) + path.substr(index + m[0].length);
                }

                return path.replace(_FORMAT_REG[4], '');
            },

            /**
             * 发送ajax请求
             * @param {Object} p                                参数
             * <pre><code>
             * {
             *     type     : 'GET'|'POST',                     //请求数据类型
             *     url      :  url,                             //请求地址
             *     dataType : 'text'|'json'|'xml',              //返回数据类型
             *     data     : null,                             //发送的数据
             *     onopen   : Function,                         //打开连接事件
             *     onchange : Function                          //响应变化
             * }
             * </code></pre>
             * @param {Function} callback  (Optional)           
             * 成功响应回调,不传入为同步请求
             * @static
             */
            ajax: function(p, callback) {
                
                if(_UNLOAD) {
                    return;
                }

                p = Jsx.extend({
                    type: 'GET',
                    dataType: 'text',
                    data: null,
                    onopen: noop
                }, p);

                p.url = Jsx.format(p.url);

                var id = Math.floor(Math.random() * 1e8);
                var xhr = _XHRS[id] =
                    global.XMLHttpRequest ? new XMLHttpRequest() :
                    new ActiveXObject('Microsoft.XMLHTTP');

                var err = {
                    url: p.url,
                    data: p.data,
                    type: p.type,
                    dataType: p.dataType
                };

                function cb() {
                    try {
                        var readyState = xhr.readyState;

                        if (readyState === 4)
                            delete _XHRS[id];
                        if (p.onchange)
                            return p.onchange(xhr);
                        if (readyState !== 4)
                            return;

                        var status = err.status = xhr.status;
                        var result = xhr.responseText;
                        if (status === 200 || status === 304) {

                            switch (p.dataType) {
                                case 'xml':

                                    result = xhr.responseXml || xhr.responseXML;
                                    if (result) {
                                        var parseError = result.parseError;
                                        if (
                                            Jsx.UA.TRIDENT && parseError && 
                                            parseError.errorCode != 0
                                        ){
                                            throw {
                                                message: 'XML format error\r\n' +
                                                        parseError.srcText + '\r\n' + 
                                                        parseError.reason + 
                                                        '\r\n,' + p.url
                                            };
                                        }
                                    }
                                    else
                                        throw { message: 'XML format error\r\n,' + p.url };
                                    break;
                                case 'json':
                                    result = EVAL('(' + result + ')');
                                    break;
                            }

                            return callback ? nextTick(callback, undefined, result) : result;
                        }
                        else{
                            if(_UNLOAD && !status)
                                return;
                            err.message = 
                                result || 'undefined error,http status=' + status;
                        }
                    }

                    catch (e) {
                        err.message = e.message;
                    }
                    throwError(err, callback);
                }

                if (callback)
                    xhr.onreadystatechange = cb;
                xhr.open(p.type, p.url, !!callback);
                p.onopen(xhr);

                try {
                    xhr.send(p.data);
                } catch (_e) { }

                if (!callback)
                    return cb();
            },

            //定义vx
            _vx: function(vx) {
                var _vx = Jsx.vx;
                var _head = _vx.head;
                var head = vx.head || {};
                _vx.dir = _vx.dir || vx.dir;

                def_vx(_head.res, head.res, 'resources');
                def_vx(_vx.body, vx.body, 'view');

                delete head.res;
                for (var name in head)
                    _head[name] = head[name];
            },

            /**
             * 从extd扩展属性至obj
             * @param  {Object} obj                 需要被扩展的对像
             * @param  {Object} extd                原始对像
             * @return {Object}                     返回扩展后的对像
             * @static
             */
            extend: function(obj, extd) {
                for (var name in extd)
                    obj[name] = extd[name];
                return obj;
            },

            /**
             * noop
             * @method _enum
             * @static
             */
            noop: noop,

            /**
             * add event listener
             * @method unon
             * @static
             */
            on: on,

            /**
             * remove event listener
             * @method unon
             * @static
             */
            unon: unon

        };

        var console = global.console || (global.console = {});
        var keys = [
            'assert',
            'count',
            'debug',
            'dir',
            'dirxml',
            'error',
            'group',
            'groupCollapsed',
            'groupEnd',
            'info',
            'log',
            'markTimeline',
            'profile',
            'profileEnd',
            'time',
            'timeEnd',
            'timeStamp',
            'trace',
            'warn'
        ];
        for (var i = 0, key; (key = keys[i]); i++)
            console[key] || (console[key] = noop);

        global.Jsx = Jsx;
        global.nextTick = nextTick;
        global.throwError = throwError;
        global.define = define;
        global.Enum = _enum;
        global.Class = _class;
        global.virtual = virtual;
        global.$f = Jsx.format;
        global.noop = Jsx.noop;
    };

    _DEFINE_GLOBAL(global, EVAL);    
    
    //**START
    var _INCLUDE_LOG = {};                                                  //包含日志
    var vx = { head: { res: {} }, body: {} };
    var MAIN;                                                               //应用程序入口
    var FILE_MAP = true;
    var MAPS = {};                                                          //文件映射表
    var MAP_NAME = '_file.map';
    var OFF_LINE = false;
    var DOC = document;
    
    var JSX_DEBUG_EXCLUDE = /(\?.*)JSX_DEBUG_EXCLUDE$/;
    var JSX_DEBUG_URL = DOC.cookie.match(/JSX_DEBUG=([^;$]+)/);
    var JSX_DEBUG = !!JSX_DEBUG_URL;
    var VERSION   = DOC.cookie.match(/VERSION=([^;$]+)/);
    var _DEBUG    = Jsx.DEBUG;
    
    JSX_DEBUG_URL = JSX_DEBUG ? decodeURIComponent(JSX_DEBUG_URL[1]) : null;
    VERSION       = VERSION ? VERSION[1] : 0;

    var NAVIGATOR  = navigator;
    var USER_AGENT = NAVIGATOR.userAgent;
    var LOCATION   = location + '';
    var NOOP       = Jsx.noop;
    var LOCAL_STORAGE = global.localStorage || (global.localStorage = {     //本地缓存对像
        getItem: function() { return null },
        setItem: NOOP,
        removeItem: NOOP,
        clear: NOOP
    });


    //获取 javascript path
    function getScritpPath(filename) {

        filename = Jsx.newPath(filename);
        if (_DEBUG) {
            var not_exclude = true;

            //是否要排除JSX调试 
            filename.replace(JSX_DEBUG_EXCLUDE, function(all, a) {
                not_exclude = false;
                return a;
            });
            if (JSX_DEBUG && not_exclude)
                return filename + '?JSX_DEBUG'; //使用 client debug
        }
        return filename;
    }

    /**
     * 包含文件
     * 一个参数使用同步ajax包含文件,只能在文件头部使用.
     * 两个参数使用异步ajax包含文件,只能在define内部使用,使用该方法会将关联文件单独压缩打包.
     * @method _i_nclude
     * @param {String}   name 包含类型的完整名称,多个用","分割
     * @param {Function} callback (Optional) 使用异步包含文件,完成后回调callback函数
     * @static
     */
    function _i_nclude(name, callback) {

        var ls = name.split(',');
        var l = ls.length;
        if (l > 1) {
            if (callback) {
                var cb = function(err) {
                    if (err)
                        return callback(err);
                    l-- ? _i_nclude(ls.shift(), cb) : callback();
                };
                return cb();
            }
            for (var i = 0; i < l; i++)
                _i_nclude(ls[i]);
            return;
        }

        var names = name.replace(/\s+/g, '').split(':');
        var alias = names[1];                            //public only after md5 file alias
        name = names[0];

        if (_INCLUDE_LOG[name]) {
            if (callback)                                //not code include
                nextTick(callback);
            return;
        }

        var vx = /\.vx($|\?|#)/i.test(name);
        var xml = (_DEBUG && vx);
        var compile = function(code) {
            if (_INCLUDE_LOG[name])
                return;
            if (_DEBUG)
                _INCLUDE_LOG[name] = (vx ? 1 : { includes: [], codes: [code] });

            if (xml)
                Jsx._Debug.vx(code);
            else
                EVAL(code);
        };

        var opt = { url: getScritpPath(alias || name), dataType: xml ? 'xml' : 'text' };
        callback ?
            Jsx.ajax(opt, function(err, data) {
                if (!err)
                    compile(data);
                callback(err);
            }) :
            compile(Jsx.ajax(opt));
    }

    Jsx.extend(Jsx, {

        //全局定义CODE
        _DEFINE_GLOBAL_CODE: _DEFINE_GLOBAL + '',

        //包含日志
        _INCLUDE_LOG: _INCLUDE_LOG,

        /**
         * 使用集成JsxDEV
         * @type {Boolean}
         * @static
         */
        JSX_DEBUG: JSX_DEBUG,
        
        /**
         * 使用集成JsxDEV,DEBUG调试服务地址,非浏览器调试.默认为浏览器模式,设置cookie更改
         * @type {String}
         * @static
         */
        JSX_DEBUG_URL: JSX_DEBUG_URL,

        /**
         * 应用程序运行目录(javascript目录)
         * @type {String}
         * @static
         */
        //APP_DIR
        APP_DIR: function() {

            //获取应该程序目录
            var scripts = DOC.getElementsByTagName('script');
            for (var i = 0, script; (script = scripts[i]); i++) {

                var src = String(script.src);
                var mat = src.match(/(Jsx|bin)\/[^\.\/]+\.js((\?|#).*)?$/i);

                if (mat) {
                    var current_dir = 
                        LOCATION.replace(/[\?\#].*$/, '').replace(/\/[^\/]*$/, '') + '/';
                    src = 
                    src.match(/^https?:/) || src.match(/^\//) ? src : current_dir + src;

                    var app_dir = Jsx.format(src).replace(mat[0], '');
                    MAIN = script.getAttribute('main') || '';
                    FILE_MAP = script.getAttribute('map') != 'false';

                    VERSION = Math.max(VERSION, script.getAttribute('version') || 0);
                    DOC.cookie =
                        'VERSION=' + VERSION + '; Expires=' + 
                        new Date(3000, 0).toUTCString() + '; Path=/';

                    if(VERSION === 0){
                        VERSION = new Date().valueOf();
                    }
                    return app_dir;
                }
            }
            return '';
        } (),

        /**
         * 站点根目录 
         * @type {String}
         * @static
         */
        ROOT_DIR: LOCATION.match(/https?:\/\/[^\/]*/) + '/',

        /**
         * 终端使用的语言 
         * @type {String}
         * @static
         */
        LANGUAGE: (NAVIGATOR.browserLanguage || NAVIGATOR.language).toLowerCase(),

        /**
         * 应用程序入口
         * @type {String}
         * @static
         */
        MAIN: MAIN,
        
        /**
         * 当前应用程序版本
         * @type {Number}
         * @static
         */
        VERSION: VERSION,

        /**
         * 版本信息
         * <pre><code>
         *   TRIDENT:        //IE内核
         *   PRESTO:         //opera内核
         *   WEBKIT:         //苹果、谷歌内核
         *   GECKO:          //火狐内核
         *   MOBILE:         //是否为移动终端
         *   IOS:            //ios终端
         *   ANDROID:        //android终端
         *   WINDOWS_PHONE:  //是否为Windows Phone
         *   IPHONE:         //是否为iPhone
         *   IPAD:           //是否iPad
         *   WEBKIT_WEB_APP  //是否WEBKIT WEB应该程序,没有头部与底部
         * </code></pre>
         * @type {Object}
         * @static
         */
        UA: {
            WINDOWS: USER_AGENT.indexOf('Windows') > -1,
            WINDOWS_PHONE: USER_AGENT.indexOf('Windows Phone') > -1,                          //是否为Windows Phone
            LINUX: USER_AGENT.indexOf('Linux') > -1,
            ANDROID: USER_AGENT.indexOf('Android') > -1,                                      //Android终端
            MACOS: USER_AGENT.indexOf('Mac OS X') > -1,
            IOS: /\(i[^;]+;( U;)? CPU.+Mac OS X/.test(USER_AGENT),                            //IOS终端
            IPHONE: USER_AGENT.indexOf('iPhone') > -1,                                        //是否为iPhone
            IPAD: USER_AGENT.indexOf('iPad') > -1,                                            //是否iPad
            MOBILE: USER_AGENT.indexOf('Mobile') > -1,                                        //是否为移动终端,IOS,Android,Windows Phone
            TRIDENT: !!USER_AGENT.match(/Trident|MSIE/),                                      //IE的内核
            PRESTO: !!(USER_AGENT.match(/Presto|Opera/)),                                     //opera内核
            WEBKIT: USER_AGENT.indexOf('AppleWebKit') > -1,                                   //苹果、谷歌内核
            GECKO: USER_AGENT.indexOf('Gecko') > -1 && USER_AGENT.indexOf('KHTML') == -1,     //火狐内核
        },
        
        //complete:

        /**
         * vx 数据 
         * @type {Object}
         * @static
         */
        vx: vx,

        /**
         * Synchronization server files, get a md5 parameter path,
         * the path across the BROWSER cache, get the latest contents of the file
         * @param  {String}   url
         * @return {String}
         */
        newPath: function(url) {
            //是否在当前域中的文件,否则返回原始路径
            var mat = Jsx.format(url).match(_READ_REG);
            if (!mat)
                return url;

            var uriparam = '?' + VERSION;
            var filename = mat[1];
            var basename = mat[3];
            var mapdir = '';
            var filedir = mat[2];
            var md5;

            //不启用文件MAP功能
            if (!FILE_MAP)
                return filename + (_DEBUG ? uriparam : '');

            //无法访问MAP文件(离线),并且在调试状态(未发布)
            //该种状态只可能是在根目录中无map文件产生
            //只适用于原始工具开发阶段,平常不会产生该种状态
            //如果真的为离线,这种方式是不访问到文件的,最终会抛出异常
            if (OFF_LINE && _DEBUG)
                return filename + uriparam;

            for (; ; ) {
                var mapname = mapdir + MAP_NAME;
                var map = MAPS[mapname];

                if (!map) {
                    var result;

                    //离线使用本地缓存(MAP)
                    if (OFF_LINE)
                        result = LOCAL_STORAGE.getItem(mapname);
                    else {
                        try {
                            //在线询问文件更新
                            result = Jsx.ajax({ url: mapname + uriparam });
                            LOCAL_STORAGE.setItem(mapname, result);
                        }
                        catch (e) {
                            //第一个MAP文件不能访问,判定为离线状态
                            if (!MAPS[MAP_NAME]) {
                                OFF_LINE = true;
                                //无法访问MAP文件,并且在调试状态(未发布)
                                if (_DEBUG)
                                    return filename + uriparam;
                            }
                            //从本地缓存中获取MAP
                            result = LOCAL_STORAGE.getItem(mapname);
                        }
                    }

                    map =
                    MAPS[mapname] = {};

                    var items = (result || '').split(/\r?\n/);
                    var i = 0;
                    var l = items.length;

                    for (; i < l; i++) {
                        var item = items[i];
                        if (item) {
                            var ls = item.split(/\s+/);
                            map[ls.shift()] = ls.join('');
                        }
                    }
                }

                md5 = map[filedir + basename];
                if (md5 || !filedir)
                    break;
                else {
                    var index = filedir.indexOf('/') + 1;
                    mapdir += filedir.substring(0, index);
                    filedir = filedir.substr(index);
                }
            }
            //以原始文件名称带MAP参数方式返回新文件名称
            //如果浏览器曾经访问过应该文件,并且文件设置过HTTP协议中拟定过的缓存头
            //势必会命中缓存,达到不用发出HTTP请求从浏览器缓存中读取
            //然而这一机制可以通过MAP文件更新新文件路径,达到及时更新缓存
            if(md5)
                return filename + '?' + md5;
            console.error(filename + ', Can not find the file map');
            return filename;
        }

    });

    global.include = _i_nclude;

    var _READ_REG = new RegExp('^(' + Jsx.APP_DIR + '(.+/)?(.+\\.[^\\?#]+))((\\?|#).*)?$');
    var complete = 0;
    var defineProperty = Object.defineProperty;
    var onerror;

    defineProperty && !(_DEBUG && JSX_DEBUG) && defineProperty(Jsx, 'onerror', {

        /** 
         * @设置系统异常事件
         * @type {Function} 
         * @static
         */
        //onerror: 

        set: function(cb) {
            if (!onerror) {
                //Online system, exception handling
                var error = function(msg) {
                    onerror(new Error(msg));
                    return true;
                }

                var attachEvent = global.attachEvent;
                if (attachEvent)
                    attachEvent('onerror', error);
                else {
                    Jsx.UA.GECKO && (global.onerror = error);

                    Jsx.on(global, 'Error', function(event) {
                        event.returnValue = false;

                        if (Jsx.UA.GECKO)
                            global.onerror = error;
                        else
                            error(event.message.replace(/^[^:]+:/, ''));
                    });
                }
            }
            onerror = cb;
        }
    });

    //Wait for page plus all the upload is complete
    //Activate the browser cache mode, 
    //but there are a small number of browser is not compatible with
    Jsx.on(global, 'load', function(e) {

        //Avoid page refresh can not use the cache
        setTimeout(function() {
            
            //debug error
            if (_DEBUG)
                _i_nclude('Jsx/_Debug.js');

            if (!MAIN)
                return;
            _i_nclude(MAIN, function(err) {
                if (err)
                    throw throwError(err);
            });
        }, 1);
    });

} (self, eval));
