/**
 * @class jsxdev.dev.Center
 * extends Ext.TabPanel
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */


include('jsxdev/mode/Text.js');
include('extjs/ext.js');

define(function() {
    Ext.Tip.prototype.maxWidth = 500;

    Class('jsxdev.dev.Center', Ext.TabPanel, {

        region: 'center',
        margins: '0 0 5 5',
        style: 'background:#f00',
        enableTabScroll: true,

        /**
         * constructor function
         * @constructor
         */
        Center: function() {
            Ext.TabPanel.call(this);
        },

        /**
         * @param {String}  filename
         */
        openFile: function(filename) {

            var component = this.findById(filename);
            if (!component) {

                switch ('text') {
                    case 'text':    //Only supports the code editor
                        component = new jsxdev.mode.Text(filename);
                        break;
                }

                this.add(component);
            }

            if (this.getActiveTab() !== component)
                this.activate(component);
        }

    });
});