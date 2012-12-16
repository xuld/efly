/**
 * @class Jsx.web.client.HttpService http service
 * @extends Object
 * @createTime 2012-03-08
 * @updateTime 2012-03-08
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

define(function() {
    var SERVICES = {}
    var HttpService =

    Class('Jsx.web.client.HttpService', null, {

        //public:
        /**
         * constructor function
         * @param {String} name (Optional) service name
         * @param {String} path (Optional) service path config
         * @constructor
         */
        HttpService: function(name, path) {

        },

        call: function() {

        },

        get: function() {

        },

        post: function() { 
            
        }

    }, {

        /**
         * get service by name
         * @param  {String} name
         * @return {Jsx.web.client.HttpService}
         */
        get: function(name) {
            if (!name)
                throw new Error('service name can not be empty');
            var service = SERVICES[name];

            if (!service)
                SERVICES[name] = service = new HttpService(name);
            return service;
        }
    });

});