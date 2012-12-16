/**
 * @class Jsx.web.WSService web socket service
 * @extends Jsx.web.service.Service
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');
include('Jsx/web/service/Service.js');
include('Jsx/web/Session.js');

define(function() {
    var Delegate = Jsx.Delegate;

    function parseError(err) {
        if (typeof err == 'string')
            err = new Error(err);

        return (err instanceof Error ? Jsx.extend({
            name: err.name,
            description: err.description,
            message: err.message
        }, err) : err);
    }

    Class('Jsx.web.service.WSService', Jsx.web.service.Service, {

        //public:
        /**
         * @event onerror
         */
        onerror: null,

        /**
         * conversation
         * @type {Jsx.web.service.conversation.Conversation}
         */
        conversation: null,

        /**
         * site session
         * @type {Jsx.web.Session}
         */
        session: null,

        /**
         * init WSService
         * @param {Jsx.web.service.conversation.Conversation} conv
         */
        init: function(conv) {
            this.initBase(conv.request);
            this.conversation = conv;
            this.session = new Jsx.web.Session(this);

            var _this = this;
            Delegate.def(this, 'error');

            conv.onopen.once(function() {
                var all = Delegate.all(_this);

                function listen(e) {
                    var msg = { type: 'event', event: e.type, data: e.data };
                    conv.send(JSON.stringify(msg));
                }

                function listenError(e) {
                    var msg = { type: 'event', event: e.type, data: parseError(e.data) };
                    conv.send(JSON.stringify(msg));
                }

                for (var i = 0, de; (de = all[i]); i++) {
                    if (de.type == 'error') 
                        de.on(listenError);
                    else 
                        de.on(listen);
                }
            });

            conv.onmessage.on(function(e) {
                var data = JSON.parse(e.data);
                var type = data.type;

                switch (type) {
                    case 'call':

                        var args = data.args;
                        var fn = _this[data.name];
                        var cb = data.callback;

                        if (!cb)
                            return fn.apply(_this, args);

                        var i = false;
                        var msg = { type: 'callback', callback: cb };

                        args.push(function(err, data) {

                            if (i)
                                return _this.error(new Error('callback has been completed'));
                            i = true;

                            if (err)
                                msg.error = parseError(err);

                            msg.data = data;
                            conv.send(JSON.stringify(msg));
                        });

                        fn.apply(_this, args);
                        break;
                    default: break;
                }

            });
        },

        action: Jsx.noop,

        /**
         * trigger error event
         * @param {Error} err
         */
        error: function(err) {
            console.error(err);
            this.onerror.emit(err);
        }

    });


});