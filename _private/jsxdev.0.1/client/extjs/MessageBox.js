
include('extjs/ext.js');

define(function() {

    Ext.apply(Ext.MessageBox, {

        error: function(title, msg, buttons, cb) {
            Ext.MessageBox.show({
                title: title,
                msg: msg,
                fn: cb,
                buttons: buttons || Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
        },

        question: function(title, msg, buttons, cb) {
            Ext.MessageBox.show({
                title: title,
                msg: msg,
                fn: cb,
                buttons: buttons || Ext.MessageBox.OK,
                icon: Ext.MessageBox.QUESTION
            });
        },

        warning: function(title, msg, buttons, cb) {
            Ext.MessageBox.show({
                title: title,
                msg: msg,
                fn: cb,
                buttons: buttons || Ext.MessageBox.OK,
                icon: Ext.MessageBox.WARNING
            });
        },

        info: function(title, msg, buttons, cb) {
            Ext.MessageBox.show({
                title: title,
                msg: msg,
                fn: cb,
                buttons: buttons || Ext.MessageBox.OK,
                icon: Ext.MessageBox.INFO
            });
        }

    });

});