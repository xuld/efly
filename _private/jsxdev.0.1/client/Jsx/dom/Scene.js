/**
 * @class Jsx.dom.Scene game scene
 * @extends Jsx.dom.Control
 * @createTime 2012-06-01
 * @updateTime 2012-06-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');
include('Jsx/Path.js');
include('Jsx/Delegate.js');
include('Jsx/Resources.js');
include('Jsx/dom/Control.js');
include('Jsx/Storage.js');

define(function(global) {
    //static private:
    var Path = Jsx.Path;
    var DEBUG = Jsx.DEBUG;
    var Control = Jsx.dom.Control;
    var Resources = Jsx.Resources;
    var Storage = Jsx.Storage;

    var SESSION_NAME = 'SCENE_SESSION_NAME_';
    var SCENE_INIT_PARAM = 'SCENE_INIT_PARAM';
    var INIT_URL_SCENE_NAME = 'scene';
    var INIT_URL_SCENE_ARGV = 'argv';
    var INIT_URL_SCENE_PREV = 'prev';
    var INIT_URL_SCENE_TOGGLE = 'toggle';
    var INIT_URL_SCENE_TOGGLE_VALUE = 'yes';
    var regSceneList = null;

    function getUrl(name, prev, message) {
        var url = Path.setHash(INIT_URL_SCENE_NAME, name);
        url = Path.setHash(INIT_URL_SCENE_ARGV, message && JSON.stringify(message), url);
        url = Path.setHash(INIT_URL_SCENE_PREV, prev && JSON.stringify(prev), url);
        return url;
    }

    //跳转到新场景
    function go(oldScene, prev, name, message, reload) {
        var fn = regSceneList[name];
        if (!fn) throw '场景"' + name + '"没有注册';

        if (reload) {
            var url = getUrl(name, prev, message);
            url = Path.remove(INIT_URL_SCENE_NAME, url);
            url = 
                Path.get(INIT_URL_SCENE_TOGGLE) ? 
                Path.remove(INIT_URL_SCENE_TOGGLE, url):
                Path.set(INIT_URL_SCENE_TOGGLE, INIT_URL_SCENE_TOGGLE_VALUE, url);
            location.href = url;
            return;
        }
        
        //toggle
        if (oldScene) {
            if (oldScene.calling) return;
            oldScene.calling = true;
        }

        fn(function(err) {
            if (err) throw err;

            var klass = Jsx.get(name);
            if (!klass) throw name + ',undefined';

            var newScene = new klass();
            newScene.prevMsg = prev;
            newScene.session = message;
            Jsx.extend(newScene.message, message);

            if (oldScene) newScene.onloadview.on(oldScene.remove, oldScene);
        });
    }

    var Scene =

    Class('Jsx.dom.Scene', Jsx.dom.Control, {

        //private:
        _session: null,

        //public:
        /**
         * 消息
         * @type {String}
         */
        message: null,

        /**
         * 上一个场景信息
         * @type {Object}
         */
        prevMsg: null,

        /**
         * get session
         * @type {Object}
         */
        get session() {
            return this._session;
        },

        /**
         * set session
         * @type {Object}
         */
        set session(val) {
            Storage.set(SESSION_NAME + this.viewName, Jsx.extend(this._session, val));
        },

        /**
         *是否正在呼叫新场景
         * @type {Boolean}
         */
        calling: false,

        /**
         * 场景视图名称
         * @type {String}
         */
        viewName: '',

        /**
         * @event onunload
         */
        onunload: null,

        /**
         * 构造函数
         * @constructor
         */
        Scene: function() {
            this.Control();
            var name = SESSION_NAME + this.viewName;

            this.message = {};
            this._session = Storage.get(name) || {};

            Jsx.Delegate.def(this, 'unload');
            $('body').append(this);

            var _this = this;
            Resources.load(function() {
                _this.loadView(_this.viewName);
            });
        },

        /**
         * 后退,必须要有跳转来源,否则无效
         * @param {Object}  message (Optional) 发送到要切换场景的消息
         */
        back: function(message) {
            var prev = this.prevMsg;
            if (prev) {
                var reload = prev.reload;
                go(this, {
                    name: this.constructor.__name__,
                    reload: reload
                },
                prev.name, message, reload);
            }
        },

        //弃用
        call: function(name, message, reload) {
            this.go(name, message, reload);
        },

        /**
         * 跳转到新场景,卸载当前场景
         * @param {String}  name               场景类型名称
         * @param {Object}  message (Optional) 发送到要新场景的消息
         * @param {Boolean} reload  (Optional) 是否要重新载入网页
         */
        go: function(name, message, reload) {

            var prev = {
                name: this.constructor.__name__,
                reload: reload
            }

            if (!reload) {
                location.href = getUrl(name, prev, message);
            }

            go(this, prev, name, message, reload);
        }
    },
    {
        /**
         * 获取场景
         * @return {Jsx.dom.Scene}
         */
        get: function() {
            var ls = $(document.body).children();
            for (var i = 0,
            l = ls.length; i < l; i++) {
                var dom = ls[i];
                if (dom instanceof Scene) return dom;
            }
            return null;
        },

        /**
         * 注册场景
         * <pre><code>
         *
         * include('Jsx/dom/Scene.js');
         * Jsx.Scene.reg({
         * //名称不能使用变量
         *   'examples.ctr.scene1':function(fn){
         *       include('examples.ctr.scene1', fn);
         *   },
         *   'examples.ctr.scene2':function(fn){
         *       include('examples.ctr.scene2', fn);
         *   },
         *   'examples.ctr.scene3':function(fn){
         *       include('examples.ctr.scene3', fn);
         *   }
         * });
         * </code></pre>
         *
         * @param {Object} obj 注册场景参数 
         * @static 
         */
        reg: function(obj) {

            regSceneList = obj;
            var name = Path.getHash(INIT_URL_SCENE_NAME) || Path.get(INIT_URL_SCENE_NAME);
            var argv = JSON.parse(Path.getHash(INIT_URL_SCENE_ARGV) || 'null');
            var prev = JSON.parse(Path.getHash(INIT_URL_SCENE_PREV) || 'null');

            if (name) {
                return go(null, prev, name, argv);
            }
            
            for (var i in obj) {
                return go(null, null, i, argv);
            }
        }
    });

});