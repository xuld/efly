/**
 * @class Jsx.web.Controller
 * @extends Jsx.web.service.HttpService
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/web/service/HttpService.js');
include('node/fs.js');

define(function() {

    Class('Jsx.web.Controller', Jsx.web.service.HttpService, {

        /**
         * view data    
         * @type {Object}
         */
        viewData: null,

        //overlay
        init: function(req, res) {
            this.Jsx_web_service_HttpService_init(req, res);
            this.viewData = {};
        },

        /**
         * @param {Object} name  view name
         */
        view: function(name) {
            this.returnFile(Jsx.format(name));
        }
    });

});