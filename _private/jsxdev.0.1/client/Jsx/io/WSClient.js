/**
 * @class Jsx.io.WSClient 
 * @extends Jsx.Event
 * @createTime 2012-01-04
 * @updateTime 2012-01-04
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/Event.js');
include('Jsx/Path.js');
include('Jsx/Config.js');
include('Jsx/io/conversation/HttpHeartbeat.js');
include('Jsx/io/conversation/WebSocket.js');

define(function() {
    var conv = Jsx.io.conversation;
    var WebSocket = conv.WebSocket;
    var HttpHeartbeat = conv.HttpHeartbeat;
    var CALLBACKS = {};
    var CLIENTS = {}
    var WSClient =

    Class('Jsx.io.WSClient', Jsx.Event, {

        //public:
        /**
         * conversation
         * @type {Jsx.io.conversation.Conversation}
         */
        conversation: null,

        /**
         * service path config
         * @type {String}
         * @static
         */
        path: Jsx.APP_DIR.replace(/^https?:\/\//i, 'ws://'),

        /**
         * service name
         * @type {String}
         */
        name: '',

        /**
         * constructor function
         * @param {String} name              service name
         * @param {String} path   (Optional) service path config, default as location
         * @constructor
         */
        WSClient: function(name, path) {
            path =
            this.path =
                Jsx.format(path || Jsx.Config.get('webService') || '')
                .replace(/^https?:\/\//i, 'ws://');
            this.name = name;

            if (WebSocket.is) {
                var mat = Jsx.Path.remove('service', path).match(/^([^\?]+)(\?([^\#]+))?/);
                this.conversation = new WebSocket(mat[1] + '?service=' + name + (mat[3] ? '&' + mat[3] : ''));
            }
            else
                this.conversation = new HttpHeartbeat(path.replace(/^wss?:\/\//, 'http://'), name);

            var _this = this;
            this.conversation.onmessage.on(function(e) {

                var data = JSON.parse(e.data);
                var type = data.type;

                switch (type) {
                    case 'event':
                        _this.emit(data.event, data.data);
                        break;
                    case 'callback':
                        var err = data.error;
                        var id = data.callback;
                        var cb = CALLBACKS[id];
                        delete CALLBACKS[id];

                        if (err)
                            throwError(err, cb);
                        else
                            cb(err, data.data);
                        break;
                    default: break;
                }

            });
        },

        /**
         * call service api
         * @param {String}    name
         * @param {Object[]}  args  (Optional)
         * @param {Function}  cb    (Optional)  callback
         */
        call: function(name, args, cb) {

            if (typeof args == 'function') {
                cb = args;
                args = [];
            }

            var msg = { type: 'call', name: name, args: args || [] };

            if (cb) {
                var id = Jsx.guid();
                msg.callback = id;
                CALLBACKS[id] = cb;
            }
            this.conversation.send(JSON.stringify(msg));
        }

    }, {

        /**
         * get service by name
         * @param  {String} name
         * @return {Jsx.io.WSClient}
         * @static
         */
        get: function(name) {
            var client = CLIENTS[name];

            if (!client)
                SERVICES[name] =
                client = new WSClient(name);
            return client;
        }

    });

});