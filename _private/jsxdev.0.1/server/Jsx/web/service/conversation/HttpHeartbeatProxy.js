/**
 * @class Jsx.web.service.conversation.HttpHeartbeatProxy conversation proxy
 * @extends Jsx.web.service.HttpService
 * @createTime 2012-01-01
 * @updateTime 2012-01-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/web/service/conversation/HttpHeartbeat.js');
include('Jsx/web/service/HttpService.js');
include('Jsx/web/service/WSService.js');

define(function() {

    var Conversation = Jsx.web.service.conversation.Conversation;


    Class('Jsx.web.service.conversation.HttpHeartbeatProxy', Jsx.web.service.HttpService, {

        //public:

        /**
         * complete handshakes, return client
         * @param {Number} token             conversation token
         * @param {Object} password          verify the password
         */
        handshakesComplete: function(token, password) {
            this.result({ type: 'handshakes_complete', token: token, password: password });
        },

        /**
         * send message to client
         * @param {String[]} msg
         */
        send: function(msg) {
            this.result({ type: 'message', data: msg });
        },

        /**
         * complete receive client data, return client
         */
        receiveComplete: function() {
            this.result({ type: 'receive_complete' });
        },

        /**
         * close the connection
         */
        close: function() {
            this.result({ type: 'close' });
        },

        /**
         * http heartbeat proxy handshakes
         * @type {String} name  service name
         */
        handshakes: function(name) {
            var _this = this;

            include(name.replace(/\./g, '/') + '.js', function(err) {

                var WSService = Jsx.web.service.WSService;
                var klass = Jsx.get(name);

                if (err || !klass) {
                    console.error('no define "' + name + '" type, http heartbeat proxy handshakes');
                    return _this.close();
                }

                if (!Jsx.equals(klass, WSService)) {
                    console.error('"' + name + '" not the correct type, http heartbeat proxy handshakes');
                    return _this.close();
                }

                new Jsx.web.service.conversation.HttpHeartbeat(_this)
                    .setService(new klass());
            });
        },

        /**
         * listen conversation change
         * @param {Number} token        conversation token
         * @param {String} password     verify the password
         */
        listen: function(token, password) {

            /*
            Note: 
            The network fault tolerance, 
            the browser will cause strange the second request, 
            this error only occurs on the server restart, 
            the BUG caused by the request can not respond to
            */
            var conversation = Conversation.get(token);
            if (conversation)
                conversation.listen(this, password);
            else
                this.close();
        },

        /**
         * receive client data
         * @param {Number} token        conversation token
         * @param {String} password     verify the password
         * @param {String} data         get data
         */
        receive: function(token, password, data) {
            var conversation = Conversation.get(token);
            if (conversation)
                conversation.receive(this, password, data);
            else
                this.close();
        }

    });

});