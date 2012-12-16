/**
 * @class Jsx.io.conversation.HttpHeartbeat
 * @extends Jsx.io.conversation.Conversation 
 * @createTime 2012-01-02
 * @updateTime 2012-01-02
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/io/conversation/Conversation.js');
include('Jsx/io/HttpService.js');

define(function() {
    var TIMEOUT = 2E4;    // error timeout default as 20s
    var MAX_DATA_LENGTH = 8e3;

    //listen server message
    function listen(_this) {
        if (!_this.open)
            return;

        var http = _this._http;
        var timeout = function() {
            timeout = null;
        } .delay(TIMEOUT);

        http.call('listen', [_this._token, _this._password.main], function(err, data) {

            if (!_this.open) {
                return;
            }

            if (err) {
                if (timeout) {
                    _this.onerror.emit(err);
                    _this.onclose.emit();
                }
                else
                    listen(_this);
                return;
            }

            switch (data.type) {
                case 'message':
                    var data = data.data;
                    for (var i = 0, l = data.length; i < l; i++)
                        _this.parser(data[i]);

                    listen(_this);
                    break;
                case 'close':
                    _this.onclose.emit();
                    break;
                default:
                    _this.onerror.emit(new Error('http heartbeat listen error'));
                    _this.onclose.emit();
                    break;
            }
        });
    }

    //send message 
    function send(_this, msg) {
        if (msg)
            _this._message.push(msg);

        var message = _this._message;
        if (_this.open && !_this._send && message.length) {

            var send_msg = '';
            var http = _this._http;

            while (message.length) {
                var l = MAX_DATA_LENGTH - send_msg.length;
                if (message[0].length < l)
                    send_msg += message.shift();

                else {
                    send_msg += message[0].substr(0, l);
                    message[0] = message[0].substr(l);
                    break;
                }
            }

            _this._send = true;

            http.call('receive', [_this._token, _this._password.aid, send_msg], function(err, data) {
                _this._send = false;

                if (err || data.type != 'receive_complete') {
                    _this.onerror.emit(err || new Error('http heartbeat send message error'));
                    _this.onclose.emit();
                }
                else
                    send(_this);
            });
        }
    }


    Class('Jsx.io.conversation.HttpHeartbeat', Jsx.io.conversation.Conversation, {

        //private:
        _http: null,
        _password: null,
        _token: 0,
        _message: null,
        _send: false,
        _url: '',
        _param: '',

        //public:
        /**
         * constructor function
         * @param {String} url             (Optional)
         * @param {String} handshakesParam (Optional)
         * @constructor
         */
        HttpHeartbeat: function(url, handshakesParam) {
            this.Conversation();
            this._url = url;
            this._param = handshakesParam;
            this._message = [];
        },

        //init rewrite
        init: function() {
            var param = this._param;
            var _this = this;

            (this._http = new Jsx.io.HttpService('Jsx.web.service.conversation.HttpHeartbeatProxy', this._url))

            .call('handshakes', param && [param], function(err, data) {

                if (err) {
                    _this.onerror.emit(err);
                    _this.onclose.emit();
                    return;
                }
                switch (data.type) {
                    case 'handshakes_complete':
                        _this._token = data.token;
                        _this._password = data.password;
                        _this.onopen.emit();

                        send(_this);
                        listen(_this);
                        break;
                    case 'close':
                        _this.onclose.emit();
                        break;
                    default:
                        _this.onerror.emit(new Error('http heartbeat handshakes error'));
                        _this.onclose.emit();
                        break;
                }
            });
        },

        //send rewrite
        send: function(msg) {
            send(this, '\u0000' + msg + '\ufffd');
            this.open || this.connect();
        },

        //close rewrite
        close: function() {
            if (this.open) {
                send(this, '\u0000\u0000'); //close
                this.onclose.emit();
            }
        }

    });

});