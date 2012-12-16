/**
 * @class jsxdev.Commands
 * @extends Object
 * @createTime 2012-01-29
 * @updateTime 2012-01-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton 
 */

include('Jsx/Util.js');

define(function() {
    var INSTANCE;

    var private_global_commands =

    Class('private_global_commands', null, {

        commands: null,

        /**
         * constructor function
         * @constructor
         */
        private_global_commands: function(ide) {
            this.commands = [];
        },

        getCommand: function(name) {
            var index = this.commands.propertyIndexOf('name', name);
            return this.commands[index];
        },

        setCommand: function(command) {
            var index = this.commands.propertyIndexOf('name', command.name);
            if (index !== -1) return;
            this.commands.push(command);
        },

        setCommands: function(commands) {
            var _this = this;
            commands.forEach(function(item) {
                _this.setCommand(item);
            })
        },

        bindKey: function(win, mac) {
            return {
                win: win,
                mac: mac
            }
        }
    });

    Class('jsxdev.Commands', null, null, {

        /**
         * get global commands manager
         * @return {jsxdev.Commands.private_global_commands}
         * @static
         */
        get: function() {
            if (INSTANCE) return INSTANCE;

            INSTANCE = new private_global_commands();
            INSTANCE.setCommands([
                {
                    name: 'x-01',
                    bindKey: INSTANCE.bindKey([
                        'F1',
                        'F2',
                        'F3',
                        'F4',
                        'F5',
                        'F6',
                        'F7',
                        'F8',
                        'F9',
                        'F10',
                        'F11',
                        'F12',
                        'Ctrl-B',
                        'Ctrl-N',
                        'Ctrl-M',
                        'Ctrl-J',
                        'Ctrl-H',
                        'Ctrl-G',
                        'Ctrl-Q',
                        'Ctrl-W',
                        'Ctrl-E',
                        'Ctrl-T',
                        'Ctrl-I',
                        'Ctrl-O',
                        'Ctrl-P',
                        'Ctrl-1',
                        'Ctrl-2',
                        'Ctrl-3',
                        'Ctrl-4',
                        'Ctrl-5',
                        'Ctrl-6',
                        'Ctrl-7',
                        'Ctrl-8',
                        'Ctrl-9',
                        'Ctrl-0'
                    ].join('|'),
                    [
                        'F1',
                        'F2',
                        'F3',
                        'F4',
                        'F5',
                        'F6',
                        'F7',
                        'F8',
                        'F9', 'F10', 'F11', 'F12', 'Command-R'].join('|')),
                    exec: function(editor) {},
                    readOnly: true
                }
            ]);
            return INSTANCE;
        }
    });

});