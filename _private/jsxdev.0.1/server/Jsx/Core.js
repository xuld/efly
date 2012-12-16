/**
 * @class Jsx
 * @createTime 2011-12-12
 * @updateTime 2011-12-12
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

(function(global) {

    //定义全局
    function _DEFINE_GLOBAL(global) {
        /*nodejs api*/
        var fs = require('fs');
        var runInThisContext = process.binding('evals').NodeScript.runInThisContext;
        var _INCLUDE_LOG = {};                                                                         //包含日志

        //清空字符串中的空格
        function empty(string) {
            return string.replace(/\s+/g, '');
        }

        // 使用 NODEJS 模块包含
        function _require(module_name) {
            if (module_name.match(/^[^\/\\\.]+$/))
                return require(module_name);
            else
                throw 'module name not correct';
        }

        /**
         * 抛出异常
         * @method throwError
         * @param {Object}   err
         * @param {Function} cb  (Optional) 异步回调错误
         * @static
         */
        function throwError(err, cb) {

            var error = err instanceof Error ? err :
                typeof err == 'string' ? 
                new Error(err) : Jsx.extend(new Error(err.message), err);

            if (cb)
                nextTick(cb, error);
            else
                throw error;
        }

        /**
         * next Tick exec
         * @method nextTick
         * @param {Object} _this (Optional) 
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

            process.nextTick(function() {
                cb.apply(_this, args);
            });
        }

        /**
         * 定义应用程序
         * @method define
         * @param {Function} def 应用程序
         * @static
         */
        function define(def) {
            def(global);
        }

        /**
         * 定义一个需要实现的虚函数
         * @type {Function}
         */
        //virtual
        function virtual() {
            throw 'Need to implement virtual functions';
        }

        //返回成员信息,0为普通字段,1为属性访问器,2为函数,3为不存在
        function getMemberType(obj, name) {

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
                    type = (typeof value == 'function') ? 2 : 0;
                }
            }
            return { property: property, value: value, type: type };
        }

        //_inherit
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
                klass = function(){};

            klass.__name__ = name;
            klass.__base__ = base;
            klass.__prot__ = members;

            if (base) {
                _constructor.prototype = base.prototype;
                klass.prototype = new _constructor();
                klass.prototype.constructor = klass;
            }

            var prototype = klass.prototype;
            for (var key in members) {

                var baseProperty = getMemberType(prototype, key);
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
                            var g = property.get;
                            var s = property.set;
                            if (g)
                                prototype.__defineGetter__(key, g);
                            if (s)
                                prototype.__defineSetter__(key, s);
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
                                    prototype[__belongs__.__name__.replace(/\./g, '_') + '_' + key] = baseValue;
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

        /**
         * 包含javascript代码文件
         * 一个参数使用同步ajax包含js文件,只能在文件头部使用.
         * 两个参数使用异步ajax包含js文件,只能在define内部使用.
         * @method _i_nclude
         * @param {String}   name                包含类型的完整名称
         * @param {Function} callback (Optional) 使用异步包含文件，完成后回调callback函数
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

            var filename = Jsx.format(empty(name));
            if (_INCLUDE_LOG[filename]) {
                if (callback) //not code include
                    nextTick(callback);
                return;
            }

            var compile = function(code) {
                if (_INCLUDE_LOG[filename])
                    return;
                _INCLUDE_LOG[filename] = 1;
                runInThisContext(code, filename, true);
            };

            if (!callback)                              //asyn include
                return compile(fs.readFileSync(filename) + '');

            fs.readFile(filename, function(err, code) {
                if (!err)
                    compile(code + '');
                nextTick(callback, err);
            });
        }
        //_i_nclude end

        function noop() { }

        var _FORMAT_REG = [
            /\\/g,
            /\/\.\//g,
            /^(\/)|(\w+:\/)/,
            /(\w+:)?\/[^\/]+\/\.{2,}/,
            /\.+\//g
        ];

        var Jsx = {

            /**
             * 应用程序运行目录(javascript目录)
             * @type {String}
             * @static
             */
            //APP_DIR
            APP_DIR: (function() {

                var mainModule = process.mainModule;
                var dir;

                if (mainModule) {
                    var path = String(mainModule.filename).replace(/\\/g, '/');
                    var reg = path.match(/Jsx\/[^\.\/]+\.js((\?|#).*)?$/i);
                    if (reg)
                        dir = path.replace(reg[0], '');
                }

                if (dir)
                    return dir;
                else
                    throw 'startup parameter error  node:   [--debug]   /../../Core.js [--debug] Jsx/xxx/xxx';
            } ()),

            /**
             * 根目录 
             * @type {String}
             * @static
             */
            ROOT_DIR: '',

            /**
             * 当前时区
             * @type {Number}
             * @static
             */
            TIMEZONE: new Date().getTimezoneOffset() / -60,

            /**
             * 把相对路径转换为完整路径
             * @param  {String} path 路径
             * @return {String} 返回完整路径
             * @static
             */
            format: function(path) {

                path = path.replace(_FORMAT_REG[0], '/').replace(_FORMAT_REG[1], '/');
                var m = path.match(_FORMAT_REG[2]);
                path = m ? m[1] ? Jsx.ROOT_DIR + path.substr(1) : path : Jsx.APP_DIR + path;

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
             * @method noop
             * @static
             */
            noop: noop

        };

        Jsx.ROOT_DIR = 
        process.platform.match(/^win(32|64)$/i) ? Jsx.APP_DIR.match('^.+:/')[0] : '/';

        global.Jsx = Jsx;
        global.require = _require;
        global.nextTick = nextTick;
        global.throwError = throwError;
        global.include = _i_nclude;
        global.define = define;
        global.Enum = _enum;
        global.Class = _class;
        global.virtual = virtual;
        global.$f = Jsx.format;
        global.noop = Jsx.noop;
    };

    //define global
    _DEFINE_GLOBAL(global);

    var MAIN = process.argv[2];
    var argv = process.argv.slice(3);
    var DEBUG = argv[0] == '--debug' && !!argv.shift();
    var GUARD = argv[0] == '--guard' && argv.shift() && !DEBUG;//启用守护进程
    var onerror;

    Jsx.extend(Jsx, {

        _DEFINE_GLOBAL_CODE: _DEFINE_GLOBAL + '',

        /**
         * file main
         * @type {String}
         * @static
         */
        MAIN: MAIN,

        /**
         * Application development and debugging
         * @type {Boolean}
         * @static
         */
        DEBUG: DEBUG,

        /**
         * App run argv
         * @type {Object[]}
         * @static
         */
        argv: argv

    });

    Object.defineProperty(Jsx, 'onerror', {

        /**
         * @设置系统异常事件
         * @type {Function} 
         * @static
         */
        //onerror:
        set: function(cb) {
            if(onerror) 
                process.removeListener('uncaughtException', onerror);
            if (!cb)
                return;
            process.on('uncaughtException', onerror = cb);
        }
    });

    if (!MAIN) return;

    var ls = [MAIN];

    if (DEBUG || process.env.WEB_SERVER_GLOBAL_AUTH_ID) ls.unshift('Jsx/_Debug.js');

    include(ls.join(), function(err) {
        if (err)
            throw err;
    });

} (global));