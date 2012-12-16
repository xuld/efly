/**
 * @class jsxdev.dev.TextSession
 * @extends ace.EditSession
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('ace/EditSession.js');

define(function() {

    Class('jsxdev.dev.TextSession', ace.EditSession, {

        //public:
        context: null,

        /**
         * constructor function
         * @param {jsxdev.mode.Text} context
         * @param {Object}          text   (Optional)
         * @param {ace.mode.Text}   mode   (Optional)
         * @constructor
         */
        TextSession: function(context, text, mode) {
            this.EditSession(text, mode);
            this.context = context;
        }

    });
});