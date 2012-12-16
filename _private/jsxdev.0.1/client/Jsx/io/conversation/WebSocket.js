/**
 * @class Jsx.io.conversation.WebSocket
 * @extends Jsx.io.conversation.Conversation 
 * @createTime 2012-01-02
 * @updateTime 2012-01-02
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/io/conversation/Conversation.js');
include('Jsx/Util.js');

define(function(global) {

    //var TEST_TIME = 5E4;
    //var TEST_MSG = '\ufffb\ubfff';

    /*
    * Send a test signal
    */
    /*
    function sendTest(_this) {

        clearTimeout(_this._test_timeout);

        _this._test_timeout =
            _this.send.delay(_this, TEST_TIME, TEST_MSG);
    }*/

    Class('Jsx.io.conversation.WebSocket', Jsx.io.conversation.Conversation, {

        //private:
        _socket: null,
        _url: '',
        _message: null,
        _test_timeout: 0,

        //public:
        /**
         * constructor function
         * @param {String} url
         * @constructor
         */
        WebSocket: function(url) {
            this.Conversation();
            this._url = url;
            this._message = [];
        },

        init: function() {
            var _this = this;
            var socket = this._socket =
                global.WebSocket ? new WebSocket(this._url) :
                global.MozWebSocket ? new MozWebSocket(this._url) : null;
            if (!socket)
                throw 'create web socket unsuccessful';

            socket.onopen = function(e) {
                var msg = _this._message;
                _this._message = [];
                _this.onopen.emit();

                for (var i = 0, l = msg.length; i < l; i++)
                    _this._socket.send(msg[i]);
                //sendTest(_this);
            };

            socket.onmessage = function(e) {
                _this.parser(e.data);
            };

            socket.onerror = function(e) {
                console.error(e);
                _this.onerror.emit(e.data);
                _this.close();
            };

            socket.onclose = function(e) {
                console.log('web socket server close');
                _this.onclose.emit(e.data);
            };
        },

        send: function(msg) {

            if (this.open) {

                this._socket.send(msg);
                //sendTest(this);
            }
            else{ //if (msg != TEST_MSG) {
                this._message.push(msg);
                this.connect();
            }
        },

        close: function() {
            if (this.open)
                this._socket.close();
        }

    }, {

        /**
         * web socket is support
         * @type {Boolean}
         * @static
         */
        is: !!(global.WebSocket || global.MozWebSocket)

    });

});