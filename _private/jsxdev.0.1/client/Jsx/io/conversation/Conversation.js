/**
 * @class Jsx.io.conversation.Conversation abstract class
 * @createTime 2012-01-02
 * @updateTime 2012-01-02
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');

define(function() {

    var Delegate = Jsx.Delegate;

    Class('Jsx.io.conversation.Conversation', null, {

        //private:
        _connect: false,

        //public:
        /**
         * open status
         * @type Boolean
         */
        open: false,

        /**
         * @event onselected
         */
        onopen: null,

        /**
         * @event onselected
         */
        onmessage: null,

        /**
         * @event onselected
         */
        onerror: null,

        /**
         * @event onselected
         */
        onclose: null,

        /**
         * constructor function
         * @constructor
         */
        Conversation: function() {
            var _this = this;
            Delegate.def(_this, 'open', 'message', 'error', 'close');
            nextTick(_this, _this.connect);

            _this.onopen.on(function() {
                _this.open = true;
                _this._connect = false;
            });

            _this.onclose.on(function() {
                _this.open = false;
                _this._connect = false;
            });

            _this.onerror.on(function() {
                _this._connect = false;
            });
        },

        /**
         * connercion server
         */
        connect: function() {
            if (!this.open && !this._connect) {
                this._connect = true;
                this.init();
            }
        },

        /**
         * parser message
         * @param {String} msg
         */
        parser: function(msg) {
            if (msg != '\ufffb\ubfff')
                this.onmessage.emit(msg);
        },

        /**
         * init conversation
         */
        init: virtual,

        /**
         * send message to server
         * @param {String} msg
         */
        send: virtual,

        /**
         * close conversation connection
         */
        close: virtual

    });

});