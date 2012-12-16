/**
 * @class Jsx.dom.Audio 声音控制
 * @extends Jsx.dom.Control
 * @createTime 2012-06-01
 * @updateTime 2012-06-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Resources.js');
include('Jsx/dom/Control.js');

define(function() {

    Class('Jsx.dom.Audio', Jsx.dom.Control, {

        _src: null,

        //pbulic:
        /**
         * 声音路径,可读属性
         * @type {String}
         */
        get src () {
            return this._src;
        },
        
        set src (value){
             if (value) {
                this._src = Jsx.Resources.get(value);
                this.dom.src = this._src;
            }
        },

        /**
         * 开始播放位置（秒）
         * @type {Number}
         */
        startTime: 0,

        /**
         * 结束播放位置（秒）,零表示最后
         * @type {Number}
         */
        endTime: 0,

        /**
         * 是否循环播放
         * @type {Boolean}
         */
        loop: false,

        /**
         * 是否自动播放
         * @type {Boolean}
         */
        autoPlay: false,

        /**
         * 构造函数
         * @constructor
         */
        Audio: function() {
            this.Control('audio');
            this.width(0).height(0);

            var dom = this.dom;
            dom.preload = true;

            this.on('timeupdate', function() {
                if (dom.currentTime < this.startTime)
                    dom.currentTime = this.startTime;
                else if (this.endTime && dom.currentTime >= this.endTime) {
                    dom.currentTime = this.startTime;
                    this.loop || dom.pause();
                }
            })

            this.on('ended', function() {
                if (this.loop) {
                    dom.currentTime = this.startTime;
                    dom.play();
                }
            });
            
            this.onloadview.on(function(){ 
                if(this.autoPlay)
                    this.play();
            });
        },

        /**
         * 复位
         * @return {Jsx.dom.Audio}
         */
        reset: function() {
            try {
                this.dom.currentTime = this.startTime;
            }
            catch (e_) { }
        },

        /**
         * 播放
         * @return {Jsx.dom.Audio}
         */
        play: function() {
            var dom = this.dom;
            dom.play && dom.play();
        },

        /**
         * 停止播放
         * @return {Jsx.dom.Audio}
         */
        stop: function() {
            var dom = this.dom;
            dom.pause && dom.pause();
            try {
                dom.currentTime = this.startTime;
            }
            catch (e_) { }
        },

        /**
         * 暂停
         * @return {Jsx.dom.Audio}
         */
        pause: function() {
            var dom = this.dom;
            dom.pause && dom.pause();
        }

    });

});