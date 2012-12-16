/**
 * @class Jsx.Thread 多线程只可以由主线程创建,子线程中不可在创建线程
 * @createTime 2011-11-11
 * @updateTime 2011-11-11
 * @extends Jsx.Event
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');
include('Jsx/Event.js');

define(function(global) {
    var _i_nclude = include;
    var Delegate = Jsx.Delegate;
    var CALLBACKS = {};  //回调列表

    var Thread =

    Class('Jsx.Thread', Jsx.Event, {

        //private:
        _worker: null,          //浏览器Worker服务

        //public:
        /**
         * 线程入口文件名称
         * @type {String}
         */
        filename: null,

        /**
         * 线程启动创建的实例类的完整名称
         * @type {String}
         */
        name: null,
        
        /**
         * 线程实体
         * @type {Object}
         */
        instance: null,

        /**
         * @event onerror  错误处理器返回false错误事件停向上传播
         */
        onerror: null,

        /**
         * @event onunload  卸载事件
         */
        onunload: null,

        /**
         * 构造函数
         * @constructor
         * @param {String}   filename                      线程入口文件名
         * @param {String}   name                          要创建类实例的完整名称
         * @param {Object}   args           (Optional)     创建实例参数
         */
        Thread: function(filename, name, args) {
            var _this = this;

            if (Thread.current)
                throw '子线程中不可在创建线程';
            if (!Jsx._INCLUDE_LOG[filename])
                throw '创建子线程请包含{0}.js'.format(filename);

            this.filename = filename;
            this.name = name;

            Jsx.Delegate.def(this, 'error', 'unload');

            var worker;
            try {
                worker = this._worker = new Worker(Jsx.APP_DIR + 'Jsx/_ThreadService.js');
            } catch (_e) {
                Thread.isThread = false;
                throw '浏览器不支持多线程 \ninfo: {0}'.format(_e.message);
            }

            worker.onmessage = function(e) {//异步代码
                var data = e.data;
                var type = data.type;
                var data = data.data;
                switch (type) {
                    case 'log':
                        console.log.apply(console, data);
                        break;

                    case 'include':  //异步包含
                        _i_nclude(data.name, function() {
                            worker.postMessage({
                                type: 'include',
                                data: {
                                    id: data.id,
                                    _INCLUDE_LOG: Jsx._INCLUDE_LOG,
                                    vx: Jsx.vx
                                }
                            });
                        });
                        break;

                    case 'callback':
                        var err = data.error;
                        var id = data.callback;
                        var cb = CALLBACKS[id];
                        delete CALLBACKS[id];

                        if (err)
                            throwError(err, cb);
                        else
                            cb(err, data.value);
                        break;

                    case 'event':
                        _this.emit(data.type, data.data);
                        break;
                    case 'close':
                        _this.close();
                        brack;
                }
            }

            worker.onerror = function(e) {
                Jsx.UA.GECKO || (e.returnValue = false);
                var data = e.message.replace(/^[^:\d]+:/, '');
                
                //不为调试状态不为JSX_DEBUG状态时输出抛出此异常
                if (_this.onerror.emit(data) && !(Jsx.DEBUG && Jsx.JSX_DEBUG))
                    throwError(e);
            }

            worker.postMessage({
                type: 'init',
                data: {
                    _INCLUDE_LOG: Jsx._INCLUDE_LOG,
                    _DEFINE_GLOBAL_CODE: Jsx._DEFINE_GLOBAL_CODE,
                    JSX_DEBUG: Jsx.JSX_DEBUG,
                    JSX_DEBUG_URL: Jsx.JSX_DEBUG_URL,
                    MAIN: Jsx.MAIN,
                    APP_DIR: Jsx.APP_DIR,
                    VERSION: Jsx.VERSION,
                    ROOT_DIR: Jsx.ROOT_DIR,
                    LANGUAGE: Jsx.LANGUAGE,
                    UA: Jsx.UA,
                    vx: Jsx.vx,
                    _FILE_NAME: filename,
                    _NAME: name,
                    _ARGS: args
                }
            });
        },

        /**
         * 调用实例函数
         * @param {String}   name      函数名称
         * @param {Object}   args      (Optional)  参数
         * @param {Function} cb        (Optional)  回调
         */
        call: function(name, args, cb) {

            if (typeof args == 'function') {
                cb = args;
                args = [];
            }

            var msg = {
                type: 'call',
                data: {
                    name: name,
                    args: args
                }
            };

            if (cb) {
                var id = Jsx.guid();
                CALLBACKS[id] = cb;
                msg.callback = id;
            }
            this._worker.postMessage(msg);
        },

        /**
         * 终止线程
         */
        close: function() {
            this.emit('unload');
            this._worker.terminate();
        }

    }, {


        /**
         * <span style="color:#f00">[static]</span>当前线程
         * @type {Jsx.Thread}
         * @static
         */
        current: null,


        /**
         * <span style="color:#f00">[static]</span>是否支持多线程
         * @type {Boolean}
         * @static
         */
        isThread: !!global.Worker

    });

});