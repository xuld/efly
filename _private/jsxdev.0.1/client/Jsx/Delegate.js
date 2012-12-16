/**
 * @class Jsx.Delegate event delegate
 * @createTime 2011-09-29
 * @updateTime 2011-09-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');

define(function() {

    function on(_this, original, listen, scope, name) {
        if (!original) throw 'Listener function can not be empty';

        _this._event || (_this._event = {
            sender: _this.sender,
            type: _this.type,
            returnValue: true,
            delegate: _this
        });

        var listens = _this._listens || (_this._listens = []);

        scope || (scope = _this._event.sender);
        name || (name = Jsx.guid());

        for (var i = 0, e; (e = listens[i]); i++) {
            if (e.original === original && e.scope === scope) return;

            if (e.name == name) {
                e.original = original;
                e.listen = listen;
                e.scope = scope;
                return;
            }
        }
        listens.splice(0, 0, {
            original: original,
            listen: listen,
            scope: scope,
            name: name
        });
        _this.length = listens.length;
        _this.emit = _emit;
    }

    function _emit(data) {

        var listens = this._listens;
        var event = this._event;
        event.data = data;
        event.returnValue = true;

        for (var i = this.length - 1; i > -1; i--) {
            var item = listens[i];
            item.listen.call(item.scope, event);
        }
        return event.returnValue;
    }

    function _empty_emit() {
        return true;
    }

    var Delegate =

    Class('Jsx.Delegate', null, {

        //private:
        _listens: null,
        _event: null,

        //public:
        /**
         * 事件类型
         * @type {String}
         */
        type: '',

        /**
         * 事件发送者
         * @type {Object}
         */
        sender: null,

        /**
         * 添加的事件侦听数量
         * @type {Number}
         */
        length: 0,

        /**
         * 构造函数
         * @constructor
         * @param {Object} sender 事件发起者
         * @param {String} type   事件类型标示
         */
        Delegate: function(sender, type) {
            this.sender = sender;
            this.type = type;
        },

        /**
         * 绑定一个事件侦听器(函数)
         * @param {Function} listen               侦听函数
         * @param {Object}   scope     (Optional) 重新指定侦听函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        on: function(listen, scope, name) {
            on(this, listen, listen, scope, name);
        },

        /**
         * 绑定一个侦听器(函数),且只侦听一次就立即删除
         * @param {Function} listen               侦听函数
         * @param {Object}   scope     (Optional) 重新指定侦听函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        once: function(listen, scope, name) {

            var _this = this;
            on(this, listen, {
                call: function(scope, evt) {
                    _this.unon(listen, scope);
                    listen.call(scope, evt);
                }
            },
            scope, name);
        },

        /**
         * Bind an event listener (function), 
         * and "on" the same processor of the method to add the event trigger to receive two parameters
         * @param {Function} listen               侦听函数
         * @param {Object}   scope     (Optional) 重新指定侦听函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        $on: function(listen, scope, name) {
            on(this, listen, {
                call: listen
            },
            scope, name);
        },

        /**
         * Bind an event listener (function), And to listen only once and immediately remove
         * and "on" the same processor of the method to add the event trigger to receive two parameters
         * @param {Function} listen               侦听函数
         * @param {Object}   scope     (Optional) 重新指定侦听函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        $once: function(listen, scope, name) {
            var _this = this;
            on(this, listen, {
                call: function(scope, evt) {
                    _this.unon(listen, scope);
                    listen(scope, evt);
                }
            },
            scope, name);
        },

        /**
         * 卸载侦听器(函数)
         * @param {Object} listen (Optional) 可以是侦听函数,也可是观察者别名,如果不传入参数卸载所有侦听器
         * @param {Object} scope  (Optional) scope
         */
        unon: function(listen, scope) {
            var ls = this._listens;
            if (!ls) return;

            if (listen) {
                var key = typeof listen == 'function' ? 'original': 'name';

                for(var i = ls.length - 1; i > -1; i--){
                    var item = ls[i];
                    if(item[key] === listen && (!scope || item.scope === scope)){
                        ls.splice(i, 1);
                    }
                }

                this.length = this._listens.length;

                if (!this.length) this.emit = _empty_emit;
            }
            else {
                this._listens = null;
                this.length = 0;
                this.emit = _empty_emit;
            }
        },

        /**
         * 发射消息,通知所有侦听器
         * @method emit
         * @param  {Object} data 要发送的数据
         * @return {Object}
         */
        emit: _empty_emit,

        /**
         * Agent forwards messages
         * @param {Object} event  event delegate data
         */
        proxyEmit: function(event) {
            event.returnValue = this.emit(event.data);
        }

    },
    {

        /**
         * define event delegate
         * @param {Object} _this
         * @param {String} argus...    event name
         * @static
         */
        def: function(_this) {
            var argu = Array.toArray(arguments);

            for (var i = 1,
            name; (name = argu[i]); i++)
            _this['on' + name] = new Delegate(_this, name);
        },

        /**
         * get all event delegate
         * @param {Object} _this
         * @return {Jsx.Delegate[]}
         * @static
         */
        all: function(_this) {
            var result = [];
            var reg = /^on/;

            for (var i in _this) {
                if (reg.test(i)) {
                    var de = _this[i];
                    Jsx.is(de, Delegate) && result.push(de);
                }
            }
            return result;
        }
    });

});