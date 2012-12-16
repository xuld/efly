/**
 * @class Jsx.web.form.QuerystringParser
 * @extends Object
 * @createTime 2012-01-12
 * @updateTime 2012-01-12
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('node/querystring.js');

define(function() {

    // This is a buffering parser, not quite as nice as the multipart one.
    // If I find time I'll rewrite this to be fully streaming as well
    var querystring = node.querystring;

    Class('Jsx.web.form.QuerystringParser', null, {

        /**
        * constructor function
        * @constructor
        */
        QuerystringParser: function() {
            this.buffer = '';
        },

        write: function(buffer) {
            this.buffer += buffer.toString('ascii');
            return buffer.length;
        },

        end: function() {
            var fields = querystring.parse(this.buffer);

            for (var field in fields) {
                this.onField(field, fields[field]);
            }
            this.buffer = '';

            this.onEnd();
        }

    });

});