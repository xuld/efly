/**
 * @class Jsx.web.client.WSClient 
 * @extends Jsx.Event
 * @createTime 2012-03-08
 * @updateTime 2012-03-08
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Config.js');
include('Jsx/Event.js');
include('Jsx/web/client/Conversation.js');

define(function() {
    var CALLBACKS = {};
    var CLIENTS = {};
    var PATH = Jsx.Config.get('webService', 'ws://localhost/').replace(/^https?:\/\//i, 'ws://');
    var WSClient =

    Class('Jsx.io.WSClient', Jsx.Event, {

        //public:
        /**
         * conversation
         * @type {Jsx.web.client.Conversation}
         */
        conversation: null,

        /**
         * service path config
         * @type {String}
         * @static
         */
        path: PATH,

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
            this.name = name;
            if (path)
                this.path = path;
            var _this = this;
            
            var url = this.path.replace('(\\?|&)({0}=[^&]*)(&|$)'.format(name), '');
            url += (url.match(/\?/) ? url.match(/(&|\?)$/) ? '' : '&' : '?') + 'service=' + name;
            var conv =
            this.conversation = new Jsx.web.client.Conversation(url);

            conv.onmessage.on(function(e) {

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
         * @return {Jsx.web.client.WSClient}
         * @static
         */
        get: function(name) {
            var client = CLIENTS[name];

            if (!client)
                SERVICES[name] = client = new WSClient(name);
            return client;
        }

    });

});