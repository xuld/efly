/**
 * @class Jsx.Ulog ,User log (用户日志)
 * @createTime 2012-09-10
 * @updateTime 2012-09-10
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/dom/Scene.js');
include('Jsx/dom/Module.js');

define(function(global) {
    var Storage = Jsx.Storage;

    //记录在缓存中的最大记录数量
    var MAX_COUNT = 100;
    var STORAGE_NAME = '_ULOG_STORAGE_NAME';

    var count = 0;
    var data = Storage.get(STORAGE_NAME) || {};
    var body = $('body');
    var scene;
    var x = 0;
    var y = 0; 
    
    //页面释放时存储日志
    Jsx.on(global, 'unload',function() {
        Storage.set(STORAGE_NAME, data);
    });
    //body.on('mouseover', getSceneName);
    
    function getSceneName(){
        if(scene){
            return scene.constructor.__name__;
        }
        
        scene = Jsx.dom.Scene.get();
        
        if(scene){
            var offset = scene.offset();
            x = offset.left;
            y = offset.top;
            return getSceneName();
        }
        return '';
    }
    
    function getModuleName(el){
        
        if(el instanceof Jsx.dom.Module){
            return el.constructor.__name__;
        }
        
        var top = el.top;
        
        if(top){
            return getModuleName(top);
        }
        return '';
    }

    function _h_click(evt) {
        
        if(count == MAX_COUNT){
            return;
        }
        
        count++;
        
        var event = evt.data;
        var dom = event.target;
        var target = $(dom);

        //根据事件目标信息生成key
        //key,x,y,time
        //,scene_name,module_name,id,text,info

        var scene_name = getSceneName();
        var module_name = getModuleName(target);
        var id = dom.id;
        var text = target.text().empty().substr(0, 20);

        //生成key
        var key = Jsx.hash(scene_name + module_name + id + text);
        var _x = event.clientX - x;
        var _y = event.clientY - y;
        var time = new Date().valueOf();

        //info
        var tag = dom.tagName;
        var w = target.width();
        var h = target.height();
        var _class = dom.className;
        //**

        var o = data[key];

        if(!o){
            data[key] = o = {
                key: key,
                sceneName: scene_name,
                moduleName: module_name,
                id: id,
                text: text,
                info: '{0}/{1}/{2}/{3}'.format(tag, w, h, _class),
                items: []
            }
        }
        
        //触发log事件
        var value = Ulog.onlog.emit(target).returnValue;
        
        o.items.push(
            Jsx.extend({ x: _x, y: _y, time: time }, value)
        );
    }

    var Ulog =

    Class('Jsx.Ulog', null, null, {

        /**
         * 日志变化
         * @event onlog 
         */
        onlog: null,

        /**
         * 开始记录
         * @static
         */
        start: function() {
            $('body').on('click', _h_click);
        },

        /**
         * 停止记录
         * @static
         */
        stop: function() {
            $('body').unon('click', _h_click);
        },

        /**
         * 清空并返回日志
         * @return {Object[]}
         */
        collapse: function() {
            var _data = data;
            Storage.set(STORAGE_NAME, data = {});
            return _data;
        },

        /**
         * 以特定字符串形式返回日志,并且清空日志数据
         * @param {Boolean} intact 返回完整数据
         * @return {String}
         */
        get: function (intact){
    
            var res = [];
            var logs = Ulog.collapse();
            var time = new Date().valueOf();
            
            for(var key in logs){
                var log = logs[key];
                        
                //key,x,y,time
                //,scene_name,module_name,id,text,info
                
                var fullValue = '';

                //为调试记录状态
                if(intact){
                    fullValue = ',{0},{1},{2},{3},{4}'.format(
                    log.sceneName, 
                    log.moduleName, 
                    log.id, 
                    log.text,
                    log.info);
                }

                var items = log.items;
                
                for(var i = 0, l = items.length; i < l; i++){
                    
                    var item = items[i];
                    var s = 
                    log.key + ',' + item.x + ',' + item.y + ',' + (time - item.time);
                    
                    if(!i){
                        s += fullValue;
                    }
                    res.push(s);
                }
                
            }
            
            return res.join('|');
        }

    });
    
    Jsx.Delegate.def(Ulog, 'log');

});