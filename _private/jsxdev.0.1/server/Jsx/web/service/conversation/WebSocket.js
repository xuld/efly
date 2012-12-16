/**
 * @class Jsx.web.service.conversation.WebSocket
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton 
 */

include('Jsx/web/service/websocket/Early.js');
include('Jsx/web/service/websocket/Hybi_07_12.js');
include('Jsx/web/service/websocket/Hybi_16.js');
include('Jsx/web/service/websocket/Hybi_17.js');

define(function() {

    var websocket = Jsx.web.service.websocket;

    var protocolVersions = {
        '7': websocket.Hybi_07_12,
        '8': websocket.Hybi_07_12,
        '9': websocket.Hybi_07_12,
        '10': websocket.Hybi_07_12,
        '11': websocket.Hybi_07_12,
        '12': websocket.Hybi_07_12,
        '13': websocket.Hybi_16,
        '14': websocket.Hybi_16,
        '15': websocket.Hybi_16,
        '16': websocket.Hybi_16,
        '17': websocket.Hybi_17
    };


    //public:
    Class('Jsx.web.service.conversation.WebSocket', null, null, {

        /**
         * create websocket
         * @param  {http.ServerRequest} req
         * @param  {Buffer}             upgradeHead
         * @return {Jsx.web.service.conversation.Conversation}
         * @static
         */
        create: function(req, upgradeHead) {
            var version = req.headers['sec-websocket-version'];
            var protocol;
            if (version && (protocol = protocolVersions[version]))
                return new protocol(req, upgradeHead);
            else
                return new websocket.Early(req, upgradeHead);
        }

    });

});