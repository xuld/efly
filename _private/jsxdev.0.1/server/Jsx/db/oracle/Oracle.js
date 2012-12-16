/**
 * @class Jsx.db.oracle.Oracle
 * @extends Jsx.db.Database
 * @createTime 2012-01-30
 * @updateTime 2012-01-30
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/db/Database.js');

define(function() {

    //public:
    Class('Jsx.db.oracle.Oracle', Jsx.db.Database, {

        /**
         * constructor function
         * @param {Object} opt (Optional)
         * @constructor
         */
        Oracle: function(opt) {
            this.Database();
            Jsx.update(this, opt);
        },

        //overlay
        use: function(db, cb) {

        },

        //overlay
        statistics: function(cb) {

        },

        //overlay
        ping: function(cb) {

        },

        //overlay
        query: function(sql, cb) {

        },

        //overlay
        close: function() {

        }

    });

});
