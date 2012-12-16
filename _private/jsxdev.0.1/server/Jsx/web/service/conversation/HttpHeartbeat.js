/**
 * @class Jsx.web.service.conversation.HttpHeartbeat
 * @extends Jsx.web.service.conversation.Conversation
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/web/service/conversation/Conversation.js');
include('Jsx/Delegate.js');

define(function() {
    var TIMEOUT = 2E4;     //wait listen timeout default as 20s
    var NOTIMEOUT = 5E4;

    var private$parser =

    Class('private$parser', null, {

        buffer: '',
        i: 0,

        private$parser: function() {
            Jsx.Delegate.def(this, 'close', 'data', 'error');
        },

        add: function(data) {
            this.buffer += data;
            this.parse();
        },

        parse: function() {
            for (var i = this.i, chr, l = this.buffer.length; i < l; i++) {
                chr = this.buffer[i];

                if (this.buffer.length == 2 && this.buffer[1] == '\u0000') {
                    this.onclose.emit();
                    this.buffer = '';
                    this.i = 0;
                    return;
                }

                if (i === 0) {
                    if (chr != '\u0000')
                        this.error('Bad framing. Expected null byte as first frame');
                    else
                        continue;
                }

                if (chr == '\ufffd') {
                    this.ondata.emit(this.buffer.substr(1, i - 1));
                    this.buffer = this.buffer.substr(i + 1);
                    this.i = 0;
                    return this.parse();
                }
            }
        },

        error: function(reason) {
            this.buffer = '';
            this.i = 0;
            this.onerror.emit(reason);
            return this;
        }
    });


    function reset(_this) {
        _this._proxy = null;
        _this._timeout = function() {

            console.log('http heartbeat timeout close');
            _this.close();
        } .delay(TIMEOUT);
    }

    function handshakesComplete(_this) {
        _this._proxy.handshakesComplete(_this.token, _this._password);
        reset(_this);
    }

    function send(_this) {
        clearTimeout(_this._no_timeout);
        _this._proxy.send(_this._message);
        _this._message = [];

        reset(_this);
    }

    /*
     * Send a test signal
     */
    function sendTest(_this) {
        _this.send('\ufffb\ubfff');
    }

    Class('Jsx.web.service.conversation.HttpHeartbeat', Jsx.web.service.conversation.Conversation, {

        //private:
        _proxy: null,
        _parser: null,
        _password: null,
        _timeout: 0,
        _no_timeout: 0,
        _message: null,

        //public:
        /**
         * constructor function
         * @param {Jsx.web.service.conversation.HttpHeartbeatProxy} proxy
         * @constructor
         */
        HttpHeartbeat: function(proxy) {
            this.Conversation(proxy.request);
            this._proxy = proxy;
            this._password = { main: Jsx.random(), aid: Jsx.random() };
            this._message = [];
        },

        /**
         * listen conversation change
         * @param {Jsx.web.service.conversation.HttpHeartbeatProxy} proxy
         * @param {String} password     verify the password
         */
        listen: function(proxy, password) {
            var _this = this;
            if (this.open && !this._proxy && this._password.main == password) {

                clearTimeout(this._timeout);
                this._proxy = proxy;
                this._no_timeout = sendTest.delay(NOTIMEOUT, _this);

                var req = proxy.request;
                

                req.on('close', function() {
                    console.log('http heartbeat close');
                    _this.close();
                });
                
                req.on('error', function(err){
                    console.log('http heartbeat error close');
                    _this.close();
                });
                
                req.on('aborted', function(){
                    console.log('http heartbeat aborted close');
                    _this.close();
                });
                
                this._message.length && send(this);
            }
            else
                proxy.close();
        },

        /**
         * receive client data
         * @param {Jsx.web.service.conversation.HttpHeartbeatProxy} proxy
         * @param {String} password     verify the password
         * @param {String} data         get data
         */
        receive: function(proxy, password, data) {
            if (this.open &&
                this._password.aid == password) {
                this._parser.add(data);
                proxy.receiveComplete();
            }
            else
                proxy.close();
        },

        init: function() {
            var _this = this;
            var parser = this._parser = new private$parser();

            handshakesComplete(this);

            parser.ondata.on(function(e) {
                _this.onmessage.emit(e.data);
            });

            parser.onclose.on(function() {
                console.log('http heartbeat parser close');
                _this.close();
            });

            parser.onerror.on(function(e) {
                console.error(e.data + '\nhttp heartbeat parser error close');
                _this.onerror.emit(e.data);
                _this.close();
            });
        },

        send: function(msg) {
            if (this.open) {

                this._message.push(msg);
                this._proxy && send(this);
            }
        },

        close: function() {
            if (this.open) {
                clearTimeout(this._timeout);
                this._proxy && this._proxy.close();
                this.onclose.emit();
            }
        }

    });

});