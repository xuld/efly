/**
 * @class Jsx.Config Application Configuration Management
 * @createTime 2012-04-15
 * @updateTime 2012-04-15
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');

define(function(global) {

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
                var data = Jsx.ajax({ url: Jsx.newPath(filename) });
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
         * @static
         */
        read: function(filename) {

            filename = Jsx.format(filename);
            var conf = _CONFS[filename];

            if (conf)
                return conf;

            var json = '{}';
            try {
                json = Jsx.ajax({ url: Jsx.newPath(filename) });
            }
            catch (err) { }

            return (_CONFS[filename] = EVAL('(' + json + ')'));
        },

        /**
         * get application configuration
         * @return {Object}
         * @static
         */
        app: function() {
            var src = Jsx.MAIN.split(/,/).desc(0).split(':').desc(0);
            return Jsx.Config.read(src.replace(/[^\/\\]+$/, '') + 'app.conf');
        },

        /**
         * get application configuration value by name
         * @param  {String} name
         * @param  {Object} defaults (Optional)
         * @return {Object}
         * @static
         */
        get: function(name, defaults) {

            return Jsx.defaults(Jsx.get(name, Jsx.Config.app()), defaults);
        }

    });


});