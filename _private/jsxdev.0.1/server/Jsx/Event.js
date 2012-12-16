/**
 * @class Jsx.Event event handle
 * @createTime 2011-11-16
 * @updateTime 2011-11-16
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');

define(function() {

    function on(_this, call, types, listen, scope, name) {
        if (typeof types == 'string')
            types = [types];

        for (var i = 0, type; (type = types[i]); i++) {
            var delegate = _this['on' + type];
            if (!delegate)
                _this['on' + type] = delegate = new Jsx.Delegate(_this, type);

            delegate[call](listen, scope, name);
        }
    }

    Class('Jsx.Event', null, {

        /**
         * 添加事件监听器(函数)
         * @param {Object}   types                事件名称或者事件名称列表
         * @param {Function} listen               侦听器函数
         * @param {Object}   scope     (Optional) 重新指定侦听器函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        on: function(types, listen, scope, name) {
            on(this, 'on', types, listen, scope, name);
        },

        /**
         * 添加事件监听器(函数),消息触发一次立即移除
         * @param {Object}   types                事件名称或者事件名称列表
         * @param {Function} listen               侦听器函数
         * @param {Object}   scope     (Optional) 重新指定侦听器函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        once: function(types, listen, scope, name) {
            on(this, 'once', types, listen, scope, name);
        },

        /**
         * Bind an event listener (function), 
         * and "on" the same processor of the method to add the event trigger to receive two parameters
         * @param {Object}   types                事件名称或者事件名称列表
         * @param {Function} listen               侦听函数
         * @param {Object}   scope     (Optional) 重新指定侦听函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        $on: function(types, listen, scope, name) {
            on(this, '$on', types, listen, scope, name);
        },

        /**
         * Bind an event listener (function), And to listen only once and immediately remove
         * and "on" the same processor of the method to add the event trigger to receive two parameters
         * @param {Object}   types                事件名称或者事件名称列表
         * @param {Function} listen               侦听函数
         * @param {Object}   scope     (Optional) 重新指定侦听函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        $once: function(types, listen, scope, name) {
            on(this, '$once', types, listen, scope, name);
        },

        /**
         * 卸载事件监听器(函数)
         * @param {String} type                事件名称
         * @param {Object} listen (Optional)   可以是侦听器函数值,也可是侦听器别名,如果不传入参数卸载所有侦听器
         * @param {Object} scope  (Optional) scope
         */
        unon: function(type, listen, scope) {
            var delegate = this['on' + type];
            if (delegate)
                delegate.unon(listen, scope);
        },

        /**
         * 发射事件
         * @param  {Object} type      事件名称
         * @param  {Object} msg       要发送的消息
         */
        emit: function(type, msg) {
            var delegate = this['on' + type];
            if (delegate)
                return delegate.emit(msg);
            return true;
        }

    });

});