/**
 * @class jsxdev.Thread   abstract class
 * @extends Object
 * @createTime 2012-03-13
 * @updateTime 2012-03-13
 * @author www.mooogame.com, simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 */

include('Jsx/Delegate.js');
include('Jsx/Util.js');

define(function() {

    Class('jsxdev.Thread', null, {

        //private:
        _watchsExp: null,
        
        //public:
        /*
         * 名称
         * @type {String}
         */
        name: '',
        
        /**
         * @type {String}
         */
        get watchsExp(){
            return this._watchsExp;
        },

        set watchsExp(val){
            this._watchsExp = val || [];
        },
        
        /**
         * @type {Array}
         */
        breakpoints: null,

        /**
         * @type {String}
         */
        rootPath: '',

        /**
         * @type {Number}
         */
        id: 0,

        /**
         * is break
         * @type {Boolran}
         */
        isBreak: false,

        /**
         * @type {Object}
         */
        opt: null,

        /**
         * @event onready
         */
        onready: null,

        /**
         * @event onbreak
         */
        onbreak: null,

        /**
         * @event onerrorbreak
         */
        onerrorbreak: null,

        /**
         * @event onoutput
         */
        onstdout: null,

        /**
         * @event onerror
         */
        onstderr: null,

        /**
         * @event onexit
         */
        onexit: null,

        /**
         * constructor function
         * @param {Object}   Object
         * @constructor
         */
        Thread: function(opt) {
            this.id = Jsx.guid();
            this.opt = opt;
            this.rootPath = opt.rootPath;
            this.breakpoints = opt.breakpoints || [];
            this.watchsExp = opt.watchsExp || [];

            Jsx.Delegate.def(this, 'ready', 'break', 'errorbreak', 'stdout', 'stderr', 'exit');

            this.onexit.on(function() {
                this.onready.unon();
                this.onbreak.unon();
                this.onerrorbreak.unon();
                this.onstdout.unon();
                this.onstderr.unon();
                this.onexit.unon();
            });
        },

        /**
         * watchs 
         * @method watchs
         * @param {String}   expression
         * @param {Function} cb
         */
        watchs: virtual,

        /**
         * eval
         * @method eval
         * @param {String}   expression
         * @param {Function} cb
         */
        eval: virtual,

        /**
         * set Break Point
         * @method setBreakpoints
         * @param {String}     name
         * @param {Number[]}   lines
         * @param {Function}   cb
         */
        setBreakpoints: virtual,

        /**
         * set all break point
         * @method setAllBreakpoints
         * @param {String}     breakpoints
         * @param {Function}   cb
         */
        setAllBreakpoints: virtual,

        /**
         * clear Break Point
         * @method clearBreakpoints
         * @param {String}     name
         * @param {Number[]}   lines
         * @param {Function}   cb
         */
        clearBreakpoints: virtual,

        /**
         * clear all break point
         * @method clearAllBreakpoints
         * @param {Function} cb
         */
        clearAllBreakpoints: virtual,

        /**
         * cont
         * @method cont
         * @param {Function} cb
         */
        cont: virtual,

        /**
         * next
         * @method next
         * @param {Function} cb
         */
        next: virtual,

        /**
         * step
         * @method step
         * @param {Function} cb
         */
        step: virtual,

        /**
         * out
         * @method out
         * @param {Function} cb
         */
        out: virtual,

        /**
         * exit
         * @method close
         */
        exit: virtual

    });

});