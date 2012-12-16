/**
 * @class Jsx.Resources 资源库(路径服务,同步资源数据)
 * @extends Object
 * @createTime 2011-04-07
 * @updateTime 2011-04-07
 * @author 楚学文
 * @version 1.0
 */

include('Jsx/Path.js');
include('Jsx/Delegate.js');
include('Jsx/Language.js');

define(function(global) {
    var Path = Jsx.Path;
    var vx = Jsx.vx;
    var items = {};
    var REG = /\{.+\}/;
    var LISTEN_LOAD = false;

    function add(src) {
        Resources.loadLength++;
        Resources.loadTotalLength++;
        var imgae = new Image();

        imgae.onerror = imgae.onload = function(e) {
            Resources.loadLength--;
            Resources.progress = 1 - (Resources.loadLength / Resources.loadTotalLength);
            Resources.onchange.emit({ type: e.type, src: src });

            if (!Resources.loadLength) {
                Resources.loadTotalLength = 0;
                LISTEN_LOAD = false;
                Resources.onload.emit();
            }
        }
        imgae.src = src;
    }

    function complete() {
        if (Resources.loadLength || LISTEN_LOAD)
            return;
        LISTEN_LOAD = true;
        nextTick(function(){
            if(Resources.loadLength)
                return;
            LISTEN_LOAD = false;
            Resources.onload.emit();
        });
    }

    var Resources =

    Class('Jsx.Resources', null, null, {
        //public:
        /**
         * 资源根目录
         * @type {String}
         * @static
         */
        dir: Jsx.appDir,

        /**
         * 下载总长度
         * @type {Number}
         * @static
         */
        loadTotalLength: 0,

        /**
         * 下载剩于长度
         * @type {Number}
         * @static
         */
        loadLength: 0,

        /**
         * @event onchange 载入变化事件
         * @static
         */
        onchange: null, //载入变化事件

        /**
         * @event onload 载入完成事件
         * @static
         */
        onload: null,

        /**
         * 完成进度 从0至1
         * @type {Number}
         * @static
         */
        progress: 1,

        /**
         * 通过名称获取资源库中的路径,获取映射资源路径
         * var src = scene.res.get('res:OK');
         * @param {String} name 资源名称或url路径
         * @return {Object} 返回src路径
         * @static
         */
        get: function(name) {

            if (name.match(/^res:/)) {
                var item = items[name.substr(4)];
                if (item)
                    return item.src;
                throw name + ',找不到资源';
            }

            name = $l(name);

            if (REG.test(name))
                return name;

            var src = Path.is(name) ? 
                name : $f(/^\//.test(name) ? name : Resources.dir + name);

            return Jsx.newPath(src);
        },

        /**
         * 从vx数据载入资源
         * @param {Function} cb (Optional)
         * @static
         */
        load: function(cb) {

            if(cb) Resources.onload.once(function() { cb() });

            var res = vx.head.res;

            Resources.dir = vx.dir || Jsx.APP_DIR;

            for (var i in res) {
                if (items[i])
                    continue;

                var item = items[i] = Jsx.extend({}, res[i]);
                var type = item.type;
                item.src = Resources.get(item.src);

                if (!item.sync || (type != 'img' && type != 'image'))
                    continue;
                add(item.src);
            }
            complete();
        },

        /**
         * 载入资源
         * @param {String[]} paths
         * @param {Function} cb (Optional)
         * @static
         */
        loadPath: function(paths, cb) {

            if(cb) Resources.onload.once(function() { cb() });
            paths.forEach(add);
            complete();
        }

    });

    global.$g = Resources.get;
    Jsx.Delegate.def(Resources, 'change', 'load');
});