/**
 * @class Jsx.web.service.websocket.Early
 * @extends Jsx.web.service.conversation.Conversation
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/web/service/conversation/Conversation.js');
include('Jsx/Delegate.js');
include('node/crypto.js');
include('node/buffer.js');

define(function() {
    var crypto = node.crypto;
    var Buffer = node.buffer.Buffer;
    var Delegate = Jsx.Delegate;
    //var TIMEOUT = 7e4;
    var TIMEOUT2 = 5e4;
    
    var private$parser =

    Class('private$parser', null, {

        buffer: '',
        i: 0,

        private$parser: function() {
            this.onclose = new Delegate(this, 'close');
            this.ondata = new Delegate(this, 'data');
            this.onerror = new Delegate(this, 'error');
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
                    var buffer = this.buffer.substr(1, i - 1);
                    if (buffer[0] != '\ufffb' && buffer[1] != '\ubfff')
                        this.ondata.emit(buffer);

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


    function _handshakes(_this, req, socket, head, parser) {

        var key1 = req.headers['sec-websocket-key1'];
        var key2 = req.headers['sec-websocket-key2'];
        var origin = req.headers.origin
        var location = (socket.encrypted ? 'wss' : 'ws') + '://' + req.headers.host + req.url;
        var upgrade = req.headers.upgrade;
        var headers;
        var encoding;

        if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
            console.error('connection invalid');
            return _this.close();
        }

        if (!_this.verifyOrigin(origin)) {
            console.error('connection invalid: origin mismatch');
            return _this.close();
        }

        if (key1 && key2) {

            if (head.length >= 8) {
                if (head.length > 8)
                    parser.add(head.slice(8, head.length) + '');

                var num1 = parseInt(key1.match(/\d/g).join('')) / (key1.match(/\s/g).length);
                var num2 = parseInt(key2.match(/\d/g).join('')) / (key2.match(/\s/g).length);
                var md5 = crypto.createHash('md5');

                md5.update(String.fromCharCode(num1 >> 24 & 0xFF, num1 >> 16 & 0xFF, num1 >> 8 & 0xFF, num1 & 0xFF));
                md5.update(String.fromCharCode(num2 >> 24 & 0xFF, num2 >> 16 & 0xFF, num2 >> 8 & 0xFF, num2 & 0xFF));
                md5.update(head.slice(0, 8).toString('binary'));

                headers = [
                    'HTTP/1.1 101 WebSocket Protocol Handshake',
                    'Upgrade: WebSocket',
                    'Connection: Upgrade',
                    'Sec-WebSocket-Origin: ' + origin,
                    'Sec-WebSocket-Location: ' + location
                ];

                var protocol = req.headers['sec-websocket-protocol'];
                if (protocol)
                    headers.push('Sec-WebSocket-Protocol: ' + protocol);

                headers.push('', md5.digest('binary'));
                encoding = 'binary';
            }
            else
                _this.close();
        }

        else {
            headers = [
                'HTTP/1.1 101 Web Socket Protocol Handshake',
                'Upgrade: WebSocket',
                'Connection: Upgrade',
                'WebSocket-Origin: ' + origin,
                'WebSocket-Location: ' + location,
                '',
                ''
            ];
            encoding = 'utf8';
        }

        try {
            socket.write(headers.join('\r\n'), encoding);
        }
        catch (e) {
            console.error(e);
            return _this.close();
        }
        return true;
    }


    Class('Jsx.web.service.websocket.Early', Jsx.web.service.conversation.Conversation, {

        //private:
        _socket: null,
        _head: null,

        //public:
        /**
         * constructor function
         * @param {http.ServerRequest} req
         * @param {Buffer}             upgradeHead
         * @constructor
         */
        Early: function(req, upgradeHead) {
            this.Conversation(req);
            this._socket = req.socket;
            this._head = upgradeHead;
        },

        init: function() {
            var _this = this;
            var socket = this._socket;
            var parser = new private$parser();

            if (!_handshakes(this, this.request, socket, this._head, parser))
                return;

            socket.setTimeout(0);
            //socket.setNoDelay(true);
            socket.setKeepAlive(true, TIMEOUT2);
            socket.setEncoding('utf8');

            socket.on('timeout', function() {
                console.log('websocket timeout close');
                _this.close();
            });

            socket.on('end', function() {
                console.log('websocket end close');
                _this.close();
            });

            socket.on('close', function() {
                console.log('websocket close');
                _this.close();
            });

            socket.on('error', function(e) {
                console.error(e);
                _this.onerror.emit(e);
                _this.close();
                _this._socket.destroy();
            });

            socket.on('data', parser.add.bind(parser));

            parser.ondata.on(_this.onmessage.proxyEmit, _this.onmessage);

            parser.onclose.on(function() {
                console.log('websocket parser close');
                _this.close();
            });

            parser.onerror.on(function(e) {
                var data = e.data;

                console.error(data);
                _this.onerror.emit(data);
                _this.close();
            });
        },

        send: function(msg) {

            if (!this.open)
                return;

            var length = Buffer.byteLength(msg);
            var buffer = new Buffer(2 + length);

            buffer.write('\x00', 'binary');
            buffer.write(msg, 1, 'utf8');
            buffer.write('\xff', 1 + length, 'binary');

            try {
                this._socket.write(buffer);
            }
            catch (e) {
                this.close();
            }
        },

        close: function() {
            if (this.open) {
                var socket = this._socket;
                socket.removeAllListeners('end');
                socket.removeAllListeners('close');
                socket.removeAllListeners('error');
                socket.removeAllListeners('data');
                socket.end();
                this.onclose.emit();
            }
        }
    });


});