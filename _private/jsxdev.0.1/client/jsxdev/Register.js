/**
 * @class jsxdev.Register
 * @extends Object
 * @createTime 2012-01-28
 * @updateTime 2012-01-28
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Util.js');
include('Jsx/io/HttpService.js');
include('extjs/ext.js');

define(function() {

    includeCss('jsxdev/res/css/style.css');

    var user = Jsx.io.HttpService.get('jsxdev.service.User');


    function handler(_this) {
        var form = _this.form.getForm();
        var load = _this.load;

        if (!form.isValid())
            return;

        load.show();

        var values = form.getValues();
        user.call('register', [values.username, values.password, values.email, ''], function(err, data) {
            load.hide();
            if (err)
                return Ext.Msg.alert(' ', err.message);

            Ext.Msg.alert(' ', 'Register success', function() {
                location.href = '/login';
            });
        });
    }

    // init
    function init(_this) {

        user.call('getCurrentUser', null, function(err, data) {

            if (data)
                return location.href = '/start';

            Ext.QuickTips.init();

            Ext.apply(Ext.form.VTypes, {

                password: function(val, field) {
                    if (field.initialPassField) {
                        var pwd = Ext.getCmp(field.initialPassField);
                        return (val == pwd.getValue());
                    }
                    return true;
                },
                passwordText: 'Passwords do not match'
            });


            new Ext.Toolbar({
                renderTo: Ext.getBody(),
                height: 26,
                items: ['<b>JsxDEV</b>', '->', {
                    text: 'Login',
                    handler: function() {
                        location.href = '/login';
                    }
                }
                ]
            });

            var panel = _this.form = new Ext.form.FormPanel({
                renderTo: Ext.getBody(),
                style: 'margin: 170px auto',
                title: 'Register',
                labelWidth: 130, // label settings here cascade unless overridden
                frame: true,
                bodyStyle: 'padding:5px 5px 0',
                width: 350,
                defaults: { anchor: '95%', msgTarget: 'side' },
                defaultType: 'textfield',

                items: [{
                    fieldLabel: 'Username',
                    name: 'username',
                    allowBlank: false
                }, {
                    fieldLabel: 'Password',
                    name: 'password',
                    id: 'password',
                    inputType: 'password',
                    allowBlank: false
                }, {
                    fieldLabel: 'Confirm Password',
                    name: 'password-cfrm',
                    vtype: 'password',
                    inputType: 'password',
                    allowBlank: false,
                    initialPassField: 'password' // id of the initial password field
                }, {
                    fieldLabel: 'Email',
                    name: 'email',
                    allowBlank: false,
                    vtype: 'email'
                }
                ],

                buttons: [{ text: 'Register', handler: handler.bind(null, _this)}]
            });
            
            panel.items.items.forEach(function(item){
                item.el.on('keydown', function(evt){
                    if(evt.keyCode == 13){
                        handler(_this);
                    }
                });
            });

            _this.load = new Ext.LoadMask(panel.el);

        });
    }

    Class('jsxdev.Register', null, {

        /**
         * form panel
         * @type {Ext.form.FormPanel}
         */
        form: null,

        /**
         * form panel
         * @type {Ext.LoadMask}
         */
        load: null,

        /**
         * constructor function
         * @constructor
         */
        Register: function() {
            init(this);
            Ext.get('loading_box').hide();
        }

    });

    new jsxdev.Register();
});





