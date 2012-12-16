/**
 * @class Jsx.dom.Css3Ani 控件,派生于Element,用于UI管理
 * @extends Jsx.dom.Element
 * @createTime 2012-06-01
 * @updateTime 2012-06-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');
include('Jsx/Delegate.js');
include('Jsx/Resources.js');
include('Jsx/dom/Element.js');

define(function() {
    var Resources = Jsx.Resources;
    var Element = Jsx.dom.Element;
    var REGEXP = new RegExp('({|;|@|.)(\\s)*(-ms-|-webkit-|-o-|-moz-)?((\\w+-)*)({0})'
        .format(Element.CSS_PREFIX_ITEM.join('|')), 'ig');

    var doc = document;
    var body = Jsx.vx.body;
    var complete = {};
    var _vx = Jsx._vx;

    /***************************************************/

    //重写
    Jsx._vx = function(vx) {
        _vx(vx);
        Resources.load();
    };

    Resources.onload.on(function() {
        var vx = Jsx.vx;
        var head = vx.head;

        for (var i in body) {
            if (!complete[i]) {
                complete[i] = 1;
                formatView(body[i]);
            }
        }

        for (var i in head) {
            var item = head[i];
            if (i != 'res' && /style/i.test(item.type) && !complete[i]) {
                complete[i] = 1;
                var style = $(doc.createElement('style'));
                style.attr('type', 'text/css');
                style.text(formatStyle(item.textContent));
                $(doc.getElementsByTagName('head')[0]).append(style);
            }
        }
    });

    //格式化样式表
    function formatStyle(css) {
        css = css.replace(REGEXP, function(all, a, b, c, d, e, f) {
            return a + Element.CSS_PREFIX + d + f;
        });
        return formatSrc(css);
    }

    //处理css样式映射 cssMap
    function formatSrc(css) {
        css = css.replace(/(url\(("|')?)(.*?)(("|')?\))/ig,
        function(all, srart, a, src, end, b) {
            return srart + Resources.get(src) + end;
        });
        return css;
    }

    /*
     * 格式化视图数据
     * @param  {Object} view
     * @return {Object}
     */
    function formatView(view) {
        if (view.src)
            view.src = Resources.get(view.src + '');
        var style = view.style;

        if (style) {
            if (typeof style == 'object') {
                for (var i in style)
                    style[i] = formatSrc(style[i]);
            }
            else {
                var items = style.trim().split(/ *; */);
                var values = {};
                for (var j = 0, item, len = items.length; j < len; j++) {
                    item = items[j];
                    if (item) {
                        item = item.split(/ *: */);
                        values[item.shift().trim()] = formatSrc(item.join(':').trim());
                    }
                }
                view.style = values;
            }
        }

        var child = view.__child;
        if (child) {
            for (var i = 0, v; (v = child[i]); i++) {
                if (typeof v == 'string')
                    child[i] = $l(v);
                else
                    formatView(v);
            }
        }
        return view;
    }

    /***************************************************/

    //替换视图中的占位
    //@param {Object} view 替换内容视图
    //@param {Object} masterView 要被替换母版视图
    function replacePlaceHolder(view, masterView) {
        var masterChild = masterView.__child;
        if (!masterChild)
            return;

        for (var i = masterChild.length - 1, e; i > -1; i--) {
            e = masterChild[i];
            if (e.Jsx) {
                if (e.viewName == 'ContentPlaceHolder') {
                    var content;
                    var viewChild = view.__child;
                    var is = false;
                    for (var j = 0, o; (o = viewChild[j]); j++) {
                        if (o.Jsx) {
                            if (is = (o.viewName == 'Content' && o.ContentPlaceHolderID == e.id)) {
                                masterChild.splice(i, 1);
                                break;
                            }
                            var qView = body[o.viewName];
                            if (is = (qView && /*qView.classApp == 'Content' &&*/ o.ContentPlaceHolderID == e.id/*qView.ContentPlaceHolderID == e.id*/)) {
                                masterChild.splice(i, 1);
                                var qViewChild = Jsx.clone(qView.__child);
                                for (var k = qViewChild.length - 1, t; k > -1; k--) {
                                    t = qViewChild[k];
                                    masterChild.splice(i, 0, t);
                                }
                                break;
                            }
                        }
                    }
                    if (!is)
                        throw '替换母版错误,在子视图中找不到替换内容,' + e.id;
                }
            }
            else if (e.tagName)
                replacePlaceHolder(view, e);
        }
    }

    //get view
    function getView(name) {
        var view = (typeof name == 'string' ? body[name] : name);
        if (!view)
            throw '找不到视图,' + name;

        var masterName = view.master;
        if (masterName) {

            //重组Master视图
            var masterView = body[masterName]
            if (!masterView)
                throw '找不到"' + masterName + '"母版视图';

            var newView = Jsx.clone(getView(masterView));
            replacePlaceHolder(view, newView);

            for (var key in view)
                /__child|master/.test(key) || (newView[key] = view[key]);
            view = body[view.viewName] = newView;
        }

        return view;
    }

    function extend(_this, extd) {
        var dom = _this.dom;
        for (var i in extd) {
            var value = extd[i];

            if (i == 'style')
                _this.css(value);

            else if (/^on/.test(i)) {
                var name = i.substr(2);
                var top = _this;
                for (; ; ) {
                    var h = top[value];
                    if (typeof h == 'function') {
                        _this.on(name, h, top);
                        break;
                    }
                    top = top.top;
                    if (!top)
                        throw value + ',事件处理器不存在';
                }
            }
            else if (i in _this && typeof _this[i] != 'function')
                _this[i] = value;

            else if (!/^__|tagName/.test(i)) {
                if (i == 'value')
                    dom.value = value;
                else
                    dom.setAttribute(i, value);
            }
        }
        if (_this.id)
            dom.id = _this.id;
    }

    function create(view, parent) {
        view = getView(view);
        var klass;
        var classApp;
        var viewName = view.viewName;
        var view1 = body[viewName];

        if (view1) {
            view = (view1 === view ? view : Jsx.extend(Jsx.extend({}, getView(view1)), view));
            classApp = view.classApp;
        }
        else  //找不到视图数据,视为匿名视图
            classApp = viewName;

        classApp = classApp ? classApp.match(/\./) ? classApp : 'Jsx.dom.' + classApp : 'Jsx.dom.Control';
        try {
            klass = eval(classApp);
            if (!klass)
                throw new Error;
        }
        catch (_e) {
            throw viewName + '未定义视图或,' + classApp + ',未定义的类型';
        }

        var control = new klass(view.tagName);
        if (parent) {
            var id = view.id;
            if (control instanceof Element) {
                id && (control.id = id);
                parent.append(control);
            }
            else if (id) {
                var top = (parent instanceof Control ? parent : parent.top);
                if (top) {
                    if (top[id])
                        throw '不能使用id:"' + id + '",已存在同名属性';
                    top[id] = control;
                }
            }
        }
        control.loadView(view);
        return control;
    }

    //加载子节点
    function load(_this, view) {
        extend(_this, view);
        var child = view.__child;
        if (!child)
            return;

        child.forEach(function(item) {
            if (typeof item == 'string')
                return _this.append(item);
            if (item.Jsx)   //为自定义控件
                return create(item, _this);

            //普通元素
            var e = new Element(item.tagName);
            e.id = item.id;
            _this.append(e);
            load(e, item);
        });
    }

    var Control =

    Class('Jsx.dom.Control', Element, {

        //public:
        /**
         * @event onloadview 初始视图完成
         */
        onloadview: null,

        /**
         * 构造函数
         * @constructor
         * @param {String} tag (Optional) 元素名称,默认使用div
         */
        Control: function(tag) {
            this.Element(tag || 'div');
            Jsx.Delegate.def(this, 'loadview');
        },

        /**
         * 使用JSON数据初化控件,这是实现的一个接口
         * @param  {Object} view json描叙的视图对像或视图名称
         */
        loadView: function(view) {
            load(this, getView(view));
            this.onloadview.emit();
        },

        //弃用
        getScene: function() {
            return this.scene();
        },

        /**
         * 获取控件所在的场景,(需在loadvlew事件完成后调用,否则不能正确返回)
         * @return {Jsx.dom.Scene}
         */
        scene: function() {
            var top = this;
            var Scene = Jsx.dom.Scene;

            while (top instanceof Control) {
                if (top instanceof Scene)
                    return top;
                top = top.top;
            }
            return null;
        }

    }, {

        //弃用
        //view: view,
        
        /**
         * 获取当前场景指定名称的视图,同时解析母板视图
         * <pre><code>
         *         <body>
         *             <SLG.test2>
         *                 <div class="top"></div>
         *                 <div class="con">
         *                     <div class="left">
         *                         <ul>
         *                             <li>A</li>
         *                             <li>B</li>
         *                             <li>C</li>
         *                             <li>D</li>
         *                         </ul>
         *                     </div>
         *                     <div class="right">
         *                         <Jsx:ContentPlaceHolder id="content1">
         *                         </Jsx:ContentPlaceHolder>
         *                     </div>
         *                 </div>
         *             </SLG.test2>
         *             <SLG.test3 classApp="SLG.test3" master="SLG.test2">
         *                 <Jsx:Content ContentPlaceHolderID="content1">
         *                       <div> 这里放置内容 </div>
         *                 </Jsx:Content>
         *             </SLG.test3>
         *         <body>
         * </code></pre>
         * @method view
         * @param {String} name
         * @return {Object} 返回视图数据 
         * @static
         */
        view: getView,

        /**
         * 从extd扩展属性
         * @method extend
         * @static
         */
        extend: extend,

        /**
         * 格式化样式表
         * @method formatStyle
         * @param   {String} css
         * @return  {String}
         */
        formatStyle: formatStyle,

        /*
         * 格式化视图数据,(包含w3c css 标准/src 路径更新/语言标签替换)
         * @method extend
         * @param  {Object} view
         * @return {Object}
         * @static
         */
        formatView: formatView,

        /**
         * 通过视图创建控件(静态函数)
         * @method create
         * @param  {Object}            view              要创建控件的视图描叙对像或该视图的名称(该对像必需为控件,否则抛出异常)
         * @param  {Jsx.dom.Element}   parent (Optional) 要追加到的父级元素(可选参数)
         * @return {Jsx.dom.Control}
         * @static
         */
        create: create

    });

});