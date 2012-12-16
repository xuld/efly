/**
 * @class jsxdev.JDServer
 * @extends Jsx.web.Server
 * @createTime 2012-01-31
 * @updateTime 2012-01-31
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/web/Server.js');
include('Jsx/Config.js');
include('node/fsx.js');

define(function() {
    var INSTANCE;
    var user = $f(Jsx.Config.get('server.user', '../user/').replace(/\/?$/, '/'));
    var workspace = $f(Jsx.Config.get('server.workspace', '../workspace/').replace(/\/?$/, '/'));
    var framework = $f(Jsx.Config.get('server.framework', '../framework/').replace(/\/?$/, '/'));

    var private_server = 

    Class('private_server', Jsx.web.Server, {

        /**
         * user dir    
         * @type {String}
         */
        user: user,

        /**
         * user dir    
         * @type {String}
         */
        workspace: workspace,

        /**
         * user dir    
         * @type {String}
         */
        framework: framework,

        /**
         * constructor function
         * @constructor
         */
        private_server: function() {
            this.Server(Jsx.Config.get('server'));

            // create user dir
            node.fsx.mkdir(this.user);
            // create workspace
            node.fsx.mkdir(this.workspace);
        }
    });

    Class('jsxdev.JDServer', null, null, {

        get: function() {
            if(!INSTANCE){
                INSTANCE = new private_server();
            }
            return INSTANCE;
        },
        
        start: function(){
            jsxdev.JDServer.get().start();
        }
        
    });

});
