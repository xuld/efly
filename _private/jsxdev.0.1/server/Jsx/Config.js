/**
 * @class Jsx.Config Application Configuration Management
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');
include('node/fsx.js');

define(function() {

    var fsx = node.fsx;
    var _CONFS = {};


    Class('Jsx.Config', null, null, {

        /**
         * read hash configuration
         * @param  {String} filename
         * @return {Object}
         * @static
         */
        readHash: function(filename) {

            filename = Jsx.format(filename);
            var conf = _CONFS[filename];

            if (!conf) {
                _CONFS[filename] = conf = {};
                var data = fsx.readFileSync(filename) + '';
                var s = data.replace(/ *#.*\r?\n?/g, '').split(/\n/);

                for (var i = 0, len = s.length; i < len; i++) {
                    var item = s[i].replace(/^\s|\s$|;\s*$/g, '').replace(/\s+|\s*=\s*/, 'QA#$%').split('QA#$%');
                    var key = item[0];
                    var value = item[1];
                    if (value)
                        conf[key] = value;
                }
            }
            return conf;
        },

        /**
         * read json configuration
         * @param  {String} filename
         * @return {Object}
         */
        read: function(filename) {

            filename = Jsx.format(filename);

            var conf = _CONFS[filename];
            if (conf)
                return conf;

            var json = '{}';
            try {
                json = fsx.readFileSync(filename);
            }
            catch (err) { }
            return (_CONFS[filename] = eval('(' + json + ')'));
        },

        /**
         * get application configuration
         * @return {Object}
         */
        app: function() {
            return Jsx.Config.read(Jsx.MAIN.replace(/[^\/\\]+$/, '') + 'app.conf');
        },

        /**
         * get application configuration value by name
         * @param  {String} name
         * @param  {Object} defaults (Optional)
         * @return {Object}
         */
        get: function(name, defaults) {

            return Jsx.defaults(Jsx.get(name, Jsx.Config.app()), defaults);
        }

    });


});