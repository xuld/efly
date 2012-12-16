/**
 * @class Jsx.web.service.conversation.Conversation abstract class
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/Delegate.js');
include('Jsx/Config.js');
include('node/url.js');
include('node/crypto.js');

define(function() {
    var url = node.url;
    var crypto = node.crypto;
    var Delegate = Jsx.Delegate;
    var INSTANCES = {};

    //open
    function open(_this) {
        _this.open = true;

        INSTANCES[_this.token] = _this;
        _this.init();
        _this.onopen.emit();
        Conversation.onopen.emit(_this);
    }

    var Conversation =

    Class('Jsx.web.service.conversation.Conversation', null, {

        //private:
        _autoOpen: true,

        //public:
        /**
         * server
         * @type {Jsx.web.Server} 
         */
        server: null,

        /**
         * request
         * @type {node.http.ServerRequest} 
         */
        request: null,

        /**
         * service
         * @type {Jsx.web.service.WSService} 
         */
        service: null,

        /**
         * Conversation token
         * @type {Number}
         */
        token: 0,

        /**
         * opened
         * @type {Boolean}
         */
        open: false,

        /**
         * @event onerror
         */
        onerror: null,

        /**
         * @event onmessage
         */
        onmessage: null,

        /**
         * @event onclose
         */
        onclose: null,

        /**
         * @event onclose
         */
        onopen: null,

        /**
         * 构造函数
         * @param {node.http.ServerRequest}   req
         * @constructor
         */
        Conversation: function(req) {
            this.server = req.socket.server;
            this.request = req;
            this.token = crypto.createHash('md5').update(Jsx.guid() + this.server.host).digest('hex');

            var _this = this;
            Delegate.def(_this, 'open', 'message', 'error', 'close');


            nextTick(function() {
                if (!_this._autoOpen)
                    return;

                if (_this.open) {
                    _this.close();
                    throw new Error('open io error current has open');
                }
                open(_this);
            });

            this.onclose.once(function() {
                _this.open = false;
                delete INSTANCES[_this.token];
                _this.onopen.unon();
                _this.onmessage.unon();
                _this.onerror.unon();
                nextTick(_this.onclose, _this.onclose.unon);
                Conversation.onclose.emit(_this);
            });
        },

        /**
         * verifies the origin of a request.
         * @param  {String} origin
         * @return {Boolean}
         */
        verifyOrigin: function(origin) {
            var origins = this.server.origins;

            if (origin === 'null')
                origin = '*';

            if (origins.indexOf('*:*') !== -1) {
                return true;
            }

            if (origin) {
                try {
                    var parts = url.parse(origin);
                    var ok =
                        ~origins.indexOf(parts.hostname + ':' + parts.port) ||
                        ~origins.indexOf(parts.hostname + ':*') ||
                        ~origins.indexOf('*:' + parts.port);
                    if (!ok)
                        console.warn('illegal origin: ' + origin);
                    return ok;
                } catch (ex) {
                    console.warn('error parsing origin');
                }
            }
            else {
                console.warn('origin missing from websocket call, yet required by config');
            }
            return false;
        },

        /**
         * set service
         * @param {Jsx.web.service.WSService}  service
         */
        setService: function(service) {
            this.service = service;
            service.init(this);

            if (this.open)
                throw new Error('has been opened can not be certified');

            var _this = this;
            this._autoOpen = false;

            service.auth(function(err, e) {

                nextTick(function() {
                    _this.open = true;

                    if (!e) //authentication failure
                        return _this.close();
                    open(_this);
                });
            });
        },

        /**
         * init Conversation
         */
        init: virtual,

        /**
         * send message to client
         * @param {String} msg
         */
        send: virtual,

        /**
         * close the connection
         */
        close: virtual

    }, {

        /**
         * @event onopen
         * @static
         */
        onopen: new Delegate(null, 'open'),

        /**
         * @event onclose
         * @static
         */
        onclose: new Delegate(null, 'close'),

        /**
         * Get Conversation by token
         * @param {Number} token
         * @return {Jsx.web.service.conversation.Conversation}
         */
        get: function(token) {
            return INSTANCES[token + ''];
        },

        /**
         * Get all conversation by token
         * @return {Jsx.web.service.conversation.Conversation[]}
         */
        all: function() {
            return INSTANCES;
        }

    });

});