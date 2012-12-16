/**
 * @class Jsx.Language 语言服务
 * @createTime 2011-09-29
 * @updateTime 2011-09-29
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton 
 */

define(function() {
    var values = {};

    var Language =

    Class('Jsx.Language', null, null, {

        /**
         * 声明语言标签,标签必须为数字
         * @param {String} 分类名
         * @param {Object} 定义值
         * @static
         */
        declare: function(type, obj) {

            var items = values[type];
            if (!items)
                values[type] = items = {};

            for (var i in obj) {
                if (/^\d+$/.test(i)) {

                    if (items[i])
                        throw '语言标记{{0}-{1}}不能重复定义'.format(type, i);
                    else
                        items[i] = obj[i];
                }
                else
                    throw '语言标记名称必须为数字';
            }
        },

        /**
         * 格式化为本地语言文本
         * <pre><code>
         * var str = '今天在日本{a-0}发生了{a-1}级大{a-2},中{a-0}北京都可以感觉到{a-2}';
         * var newStr = $F(str);
         * </code></pre>
         * @param {String} text 要格式化的文本
         * @return {String} 返回格式化后的文本
         * @static
         */
        format: function(text) {

            text = text.replace(/\{(.+?)\-(\d+)\}/g, function(all, type, label) {
                var items = values[type];

                if (items) {
                    var item = items[label];
                    if (item)
                        return item;
                }
                return all;
            });
            return text;
        }

    });

    global.$l = Jsx.Language.format;

});