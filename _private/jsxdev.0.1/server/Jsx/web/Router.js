/**
 * @class Jsx.web.Router
 * @createTime 2011-12-14
 * @updateTime 2011-12-14
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */


define(function() {

    Class('Jsx.web.Router', null, {

        /**
         * 路由规则
         * @type {Object[]}
         */
        rules: null,

        /**
         * Service to handle static files
         * @type {String}
         */
        staticService: 'Jsx.web.service.StaticService',

        /**
         * 构造函数
         * @constructor
         */
        Router: function() {
            this.rules = [];
        },

        /**
         * 设置路由器
         * @param {Object} rules   路由配置
         */
        setting: function(conf) {

            var virtual = conf.virtual || '';
            Jsx.update(this, conf);

            //默认路由
            var rules = [
                { match: '/?method={service}.{action}' },
                { match: '/?service={service}&action={action}' },
                { match: '/?service={service}', action: '$' }

            ].concat(Array.isArray(conf.router) ? conf.router : []);


            this.rules = [];

            for (var i = 0, item; (item = rules[i]); i++) {

                var rule = { match: null, keys: [], defaultValue: {} };
                var match = (virtual + item.match)
                    .replace(/\{([^\}]+)\}|[\|\[\]\(\)\{\}\?\.\+\*\!\^\$\:\<\>\=]/g,
                    function(all, r) {

                        if (r) {
                            rule.keys.push(r);
                            switch (r) {
                                case 'service': return '([\\w\\$\\./]+)';
                                case 'action': return '([\\w\\$]+)';
                            }
                            return '([^&]+)';
                        }
                        else
                            return '\\' + all;
                    });

                rule.match = new RegExp('^' + match + (match.match(/\?/) ? '' : '$'), 'i');
                for (var j in item) {
                    if (j != 'match')
                        rule.defaultValue[j] = item[j];
                }

                if ((rule.keys.indexOf('service') !== -1 || rule.defaultValue.service) &&
                    (rule.keys.indexOf('action') !== -1 || rule.defaultValue.action)) {
                    this.rules.push(rule);
                }

            }
        },


        /**
         * get router info by url
         * @param  {String} url 
         * @return {Object}
         */
        get: function(url) {

            var rules = this.rules;
            for (var i = 0, item; (item = rules[i]); i++) {

                var keys = item.keys;
                var mat = url.match(item.match);

                if (mat) {

                    var info = Jsx.extend({}, item.defaultValue);

                    for (var j = 1, len = mat.length; j < len; j++){
                        info[keys[j - 1]] = mat[j];
                    }

                    info.service = info.service.replace(/\//g, '.');
                    return info;
                }

            }

            return {
                service: this.staticService,
                action: '$'
            };
        }

    });


});