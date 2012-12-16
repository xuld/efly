/**
 * @class Jsx.dom.Module module in the scene
 * @extends Jsx.dom.Control
 * @createTime 2012-06-01
 * @updateTime 2012-06-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/dom/Control.js');
include('Jsx/Storage.js');

define(function() {
    var Control = Jsx.dom.Control;
    var Storage = Jsx.Storage;
    
    var MODULE_DATA = '_MODULE_DATA';
    var MODULE_SESSION = 'MODULE_SESSION_'

    function v(_this, names, viewName) {
        return new RegExp('\\*|' + viewName).test(names || _this.names);
    }

    function go(_this, prev, viewName, message) {

        var parent = _this.parent();
        var data = Jsx.extend({}, Control.view(viewName));
        var extend = { prevMsg: prev, message: message || {} };
        var col = Control.create(Jsx.extend(extend, data), parent);

        _this.after(col);
        _this.remove();
    }

    Class('Jsx.dom.Module', Control, {
    
        //private:
        _session: null,
        
        //public:
        /**
         * 视图名称
         * @type {String}
         */
        viewName: '',

        /**
         * 上一个模块信息
         * @type {Object}
         */
        prevMsg: null,

        /**
         * 指定可载入的视图,默认为任何视图
         * @type {String}
         */
        names: '*',

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
            Storage.set(MODULE_SESSION + this.viewName, Jsx.extend(this._session, val));
        },
        
        /**
         * 消息
         * @type {String}
         */
        message: null,

        /**
         * 构造
         * @param {String} tag
         * @constructor
         */
        Module: function(tag) {
            this.Control(tag);
            this._session = {};
            this.message = {};
        },

        //重写
        loadView: function(view) {
            view = Control.view(view);
            var data;
            var scene = this.scene();
            
            if(scene) {
                var session = scene.session;
                data = session[MODULE_DATA];
                if(data && v(this, view.names, data.viewName)) {
                    delete session[MODULE_DATA];
                    scene.session = session;
                    go(this, data.prev, data.viewName, data.message);
                    return;
                }
            }
            
            this.viewName = view.viewName;
            this._session = Storage.get(MODULE_SESSION + view.viewName) || {};
            this.session = view.message;
            this.Jsx_dom_Control_loadView(view);
        },

        /**
         * 后退,必须要有跳转来源,否则无效
         * @param {Object} message (Optional)
         */
        back: function(message) {
            var prev = this.prevMsg;
            if(prev) {
                var scene = prev.scene;
                if(scene) 
                    return this.broadcast(scene, prev.name, null, message, prev.reload);
                return this.go(prev.name, message);
            }
            this.getScene().back(message);
        },

        /**
         * 跳转到目标模块
         * @param {String}  viewName
         * @param {Object}  message       (Optional)
         */
        go: function(viewName, message) { 
            if (v(this, this.names, viewName))
                go(this, { name: this.viewName }, viewName, message);
        },
        
        /**
         * 广播
         * @param {String}  sceneName
         * @param {String}  viewName
         * @param {Object}  message        (Optional)
         * @param {Object}  moduleMessage  (Optional)
         * @param {Boolean} reload         (Optional)
         */
        broadcast: function(sceneName, viewName, message, moduleMessage, reload) {
            var scene = this.getScene();
            var prev = { name: this.viewName, scene: scene.viewName, reload: reload };

            message = message || {};
            message[MODULE_DATA] = { viewName: viewName, message: moduleMessage, prev: prev };
            scene.call(sceneName, message, reload);
        }
    });
});
