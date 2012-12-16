/**
 * @class Jsx.dom.Element
 * @createTime 2012-06-01
 * @updateTime 2012-06-01
 * @author www.mooogame.com, Simplicity is our pursuit
 * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
 * @version 1.0
 * @singleton
 */

include('Jsx/Util.js');
include('Jsx/Delegate.js');

define(function(global) {
    //using type
    var Delegate = Jsx.Delegate;
    
    var DOC = document;
    var QUERY_REG_EXP = /^((#)|(\.)|(\*))?(\w+)?(\[(\w+)(((\=)|(\!))(\w+))?\])?$/;

    var html = DOC.getElementsByTagName('html').item(0);
    var getComputedStyle = global.getComputedStyle;

    var ELEMENT_DISPLAYS = {};
    var CSS_PREFIX =
        (Jsx.UA.TRIDENT ? 'ms-' :
        Jsx.UA.PRESTO ? 'O-' :
        Jsx.UA.WEBKIT ? 'Webkit-' : Jsx.UA.GECKO ? 'Moz-' : ''); //CSS前缀

    function getDelegate(_this, type) {

        var _type = 'on' + type;
        var dom = _this.dom;
        var del = _this[_type];
        if (del)
            return del;

        _this[_type] = del = new Delegate(_this, type);
        var events = _this._events || (_this._events = {});

        //system event
        Jsx.on(dom, type, events[type] = function(evt) {
            var returnValue = del.emit(evt);
            if (returnValue === false) {
                evt.preventDefault();
                evt.stopPropagation();
            }
            evt._return = returnValue;
            evt.returnValue = returnValue;
        });
        return del;
    }

    function on(_this, call, types, listen, scope, name) {
        if (typeof types == 'string')
            types = [types];

        for (var i = 0, l = types.length; i < l; i++)
            getDelegate(_this, types[i])[call](listen, scope, name);
    }
    
    //创建Element
    function create(o){
        if (o.nodeType == 1) {//HTMLElement
            var entity = o.entity;
            if (!entity)
                entity = new Element(o);
            return entity;
        }
        
        if (o.Element === Element)
            return o;

        if (typeof o != 'string'){
            return null;
        }
        
        if(/^( *<[^>]+>.*?< *\/[^>]+>| *<.+?\/ *> *)/.test(o)) {//Html
        
            var tagName;
            var attrs;

            var tags = o.replace(/(<(\w+)[^>]*?)\/>/g, function(all, front, tag) {
                return tag.match(
                    /^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i) ?
                    all : front + '></' + tag + '>';
            });

            var wrap =
				!tags.indexOf('<opt') &&
				[1, '<select multiple="multiple">', '</select>'] ||
				!tags.indexOf('<leg') &&
				[1, '<fieldset>', '</fieldset>'] ||
				tags.match(/^<(thead|tbody|tfoot|colg|cap)/) &&
				[1, '<table>', '</table>'] ||
				!tags.indexOf('<tr') &&
				[2, '<table><tbody>', '</tbody></table>'] ||
				(!tags.indexOf('<td') || !tags.indexOf('<th')) &&
				[3, '<table><tbody><tr>', '</tr></tbody></table>'] ||
				!tags.indexOf('<col') &&
				[2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'] ||
				[0, '', ''];

            var div = DOC.createElement('div');
            div.innerHTML = wrap[1] + tags + wrap[2];

            while (wrap[0]--)
                div = div.lastChild;
            var first = div.firstChild;
            return new Element(first.nodeType == 1 ? first : first.nextSibling);
        }
        return null;
    }

    //static private:
    //查询元素集合
    function query(top, elements, exp) {

        var results = elements;
        if (exp) {
            var match = QUERY_REG_EXP.exec(exp);
            var results = [];
            
            if (match && elements[0]) {
                
                if (match[2]) {//id
                    for (var i = 0, e; (e = elements[i]); i++) {
                        if (e.id == match[5]) {
                            results.push(e);
                            break;
                        }
                    }
                }
                
                else if (match[3]) { //class
                    for (var i = 0, e; (e = elements[i]); i++){
                        if(e.className == match[5])
                            results.push(e);
                    }
                }
                
                else if (match[4])
                    results = elements; //all

                else if (match[5]) {    //label
                
                    var reg = new RegExp('^' + match[5] + '$', 'i');
                    
                    for (var i = 0, e; (e = elements[i]); i++){
                        if(reg.test(e.tagName))
                            results.push(e);
                    }
                }
                
                var attrName = match[7];
                var value = match[12];

                if (attrName) {//过滤属性
                    elements = results;
                    results = [];
                    for (var i = 0, e; (e = elements[i]); i++) {
                        var attr = e.getAttribute(attrName);

                        if (match[8]) { //需要对比属性值
                            //需要相等的值或不相等的值
                            if (match[10] ? attr == value : attr != value)
                                results.push(e);
                        }
                        else if (attr)
                            results.push(e); //只要有值就可以
                    }
                }

            }
        }

        for (var i = 0, item; (item = results[i]); i++) {
            var entity = item.entity;
            if (!entity) {
                entity = new Element(item);
                entity.top = top;
                if(entity.id && top){
                    top[entity.id] = entity;
                }
            }
            results[i] = entity;
        }
        return results;
    }

    //获取子节点
    function find(elem, out) {
        var ns = elem.childNodes;
        for (var i = 0, e; (e = ns[i]); i++) {

            if (e.nodeType == 1) {
                out.push(e);
                var entity = e.entity;

                //当前如果为控件不在往下查询
                if (entity) {
                    var c = entity.Control;
                    if (c && c === Jsx.dom.Control)
                        continue;
                }
                find(e, out);
            }
        }
        return out;
    }

    //清空子节点清除事件绑定
    function empty(_this) {

        var ns = _this.dom.childNodes;
        for (var i = 0, e; (e = ns[i]); i++) {

            if (e.nodeType == 1) {
                var entity = e.entity;
                if (entity)
                    remove(entity);
            }
        }
    }

    function remove(_this) {
        empty(_this);
        _this.emit('unload');

        var dom = _this.dom;
        var events = _this._events;
        var top = _this.top;
        var id = _this.id;

        for (var name in events)
            Jsx.unon(dom, name, events[name]);

        delete dom.entity;
        if (top) {
            delete _this.top;
            if (id)
                delete top[id];
        }
    }

    //通过元素获取顶层控件
    function top(elem) {
        var item;
        while (item = elem.parentNode) {
            var entity = item.entity;
            if (entity) {
                var c = entity.Control;
                if (c && c === Jsx.dom.Control)
                    return entity;
            }
            elem = item;
        }
    }

    //获取text
    function text(elem) {
        var ns = elem.childNodes;
        var value = '';
        for (var i = 0, dom; (dom = ns[i]); i++) {
            if (dom.nodeType != 8)
                value += dom.nodeType != 1 ? dom.nodeValue : text(dom);
        }
        return value;
    }

    //添加子控件
    function addChild(top, el) {
        if (top) {
            var id = el.id;
            var sourceTop = el.top;
            if (sourceTop && id)
                delete sourceTop[id];

            el.top = top;
            if (id) {
                if (top[id] === undefined)
                    top[id] = el;
                else
                    throw '不能使用id:"{0}",已存在同名属性'.format(id);
            }
        }
    }

    var Element =

    Class('Jsx.dom.Element', null, {

        //private:
        _events: null,
        //临时值
        _display: null,

        //public:
        /**
         * 元素ID
         * @type {String}
         */
        id: '',

        /*
         * 文档元素
         * @type {HTMLElement}
         */
        dom: null,

        /**
         * 顶层控件
         * @type {Jsx.dom.Control}
         */
        top: null,

        /**
         * 构造函数
         * @constructor
         * @param {Object} opt HTML元素名称或者元素节点
         */
        Element: function(opt) {
            if (typeof opt == 'string')
                this.dom = DOC.createElement(opt);
            else {
                if (opt.entity)
                    throw '该构造不能被外部调用';
                this.dom = opt;
                if(opt.id) {
                    this.id = opt.id;
                }
            }
            this.dom.entity = this;
        },

        /**
         * 添加事件监听器(函数)
         * @param {Object}   types                事件名称或者事件名称列表
         * @param {Function} listen               侦听器函数
         * @param {Object}   scope     (Optional) 重新指定侦听器函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        on: function(types, listen, scope, name) {
            on(this, 'on', types, listen, scope, name);
        },

        /**
         * 添加事件监听器(函数),消息触发一次立即移除
         * @param {Object}   types                事件名称或者事件名称列表
         * @param {Function} listen               侦听器函数
         * @param {Object}   scope     (Optional) 重新指定侦听器函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        once: function(types, listen, scope, name) {
            on(this, 'once', types, listen, scope, name);
        },

        /**
         * Bind an event listener (function), 
         * and "on" the same processor of the method to 
         * add the event trigger to receive two parameters
         * @param {Object}   types                事件名称或者事件名称列表
         * @param {Function} listen               侦听函数
         * @param {Object}   scope     (Optional) 重新指定侦听函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        $on: function(types, listen, scope, name) {
            on(this, '$on', types, listen, scope, name);
        },

        /**
         * Bind an event listener (function), 
         * And to listen only once and immediately remove
         * and "on" the same processor of the method to add the event trigger to 
         * receive two parameters
         * @param {Object}   types                事件名称或者事件名称列表
         * @param {Function} listen               侦听函数
         * @param {Object}   scope     (Optional) 重新指定侦听函数this
         * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
         */
        $once: function(types, listen, scope, name) {
            on(this, '$once', types, listen, scope, name);
        },

        /**
         * 卸载事件监听器(函数)
         * @param {String} type                事件名称
         * @param {Object} listen (Optional)   
         * 可以是侦听器函数值,也可是侦听器别名,如果不传入参数卸载所有侦听器
         * @param {Object} scope  (Optional) scope
         */
        unon: function(type, listen, scope) {
            var del = this['on' + type];
            if (del)
                del.unon(listen, scope);
        },

        /**
         * 发射事件
         * @param  {Object} type      事件名称
         * @param  {Object} msg       要发送的消息
         */
        emit: function(type, msg) {
            var dom = this.dom;
            var _type = 'on' + type;

            if (_type in dom && dom.dispatchEvent) {

                var evt = 
                    DOC.createEvent(type.match(/mouse|click/i) ? 'MouseEvents' : 'Events');
                evt.initEvent(type, true, false);
                Jsx.extend(evt, msg);
                dom.dispatchEvent(evt);
                return evt._return;
            }

            var del = this[_type];
            return del ? del.emit(msg) : true;
        },

        /**
         * 显示控件
         */
        show: function() {
            if (this.css('display') != 'none')
                return;
            var dom = this.dom;

            if (this._display)
                dom.style.display = this._display;
            else {
                var tagName = dom.tagName;
                var display = ELEMENT_DISPLAYS[tagName];
                if (!display) {
                    var elem = DOC.createElement(tagName);

                    DOC.body.appendChild(elem);
                    ELEMENT_DISPLAYS[tagName] =
                        display = getComputedStyle(elem, null).display;
                    DOC.body.removeChild(elem);
                }
                dom.style.display = display;
            }
        },

        /**
         * 隐藏控件
         */
        hide: function() {
            var dom = this.dom;
            var display = this.css('display');

            if (display != 'none') {
                this._display = display;
                dom.style.display = 'none';
            }
        },

        /**
         * 返回当前元素是否在显示状态
         * @return {Boolean}
         */
        visible: function() {
            return this.css('display') !== 'none';
        },

        /**
         * 显示与隐藏切换
         */
        toggle: function() {
            this.visible() ? this.hide() : this.show();
        },

        /**
         * 获取或设置CSS样式,重载,一个参数为获取样式,
         * 二个参数为设置参数,第一个参数为Object时为设置css参数集合
         * @param {String} name 样式名称
         * @param {Object} value (Optional) 样式值
         * @return {Object}
         */
        css: function(name, value) {
            var dom = this.dom;
            if (typeof name == 'string' && value === undefined) { //获取样式
                name = Element.parseCssName(name);
                return dom.style[name] || getComputedStyle(dom, null)[name];
            }
            else { //设置样式
                if (typeof name == 'object') {
                    //样式键值对
                    for (var i in name)
                        dom.style[Element.parseCssName(i)] = name[i];
                }
                else
                    dom.style[Element.parseCssName(name)] = value;
            }
        },

        /**
         * 获取或设置属性,重载,一个参数为获取属性,
         * 二个参数为设置属性,第一个参数为Object时为设置attr参数集合
         * @param {String} name 属性名称
         * @param {Object} value (Optional) 属性值
         * @return {Object}
         */
        attr: function(name, value) {
            var dom = this.dom;
            if (typeof name == 'object') {
                for (var i in name)
                    dom.setAttribute(i, name[i]);
            }
            else if (value === undefined)
                return dom.getAttribute(name);
            else
                dom.setAttribute(name, value);
        },

        /**
         * 删除属性
         * @param  {String} name 要删除的属性名称
         */
        removeAttr: function(name) {
            this.dom.removeAttribute(name);
        },

        /**
         * 添加class样式
         * @param {String} name 样式类名
         */
        addClass: function(name) {
            var dom = this.dom;
            var cls = dom.className;
            var names = name.split(/ +/);

            for (var i = 0; (name = names[i]); i++) {
                var reg = new RegExp('(^| +){0}( +|$)'.format(name), 'g');
                if (!reg.test(cls))
                    cls = cls + ' ' + name;
            }
            cls = cls.trim();
            if (cls != dom.className)
                dom.className = cls;
        },

        /**
         * 删除class样式
         * @param {String} name 要删除的样式名称
         */
        removeClass: function(name) {
            var dom = this.dom;
            var cls = dom.className;
            var names = name.split(/ +/);

            for (var i = 0; (name = names[i]); i++)
                cls = cls.replace(new RegExp('(^| +){0}( +|$)'.format(name), 'g'), ' ');
            cls = cls.trim();
            if (cls != dom.className)
                dom.className = cls;
        },

        /**
         * 在两个class中切换
         */
        toggleClass: function(name) {
            var dom = this.dom;
            var cls = dom.className;
            var names = name.split(/ +/);

            for (var i = 0; (name = names[i]); i++) {
                var reg = new RegExp('(^| +){0}( +|$)'.format(name), 'g');
                if (reg.test(cls))
                    cls = cls.replace(reg, ' ');
                else
                    cls = cls + ' ' + name;
            }
            dom.className = cls.trim();
        },

        /**
         * 元素距离绝对父元素的位置,慎用,频繁使用会导致效率问题
         * @return {Object}
         */
        position: function() {
            var dom = this.dom;
            var offsetParent = dom.offsetParent || DOC.body;
            var offset = this.offset();

            while (!/^body|html$/i.test(offsetParent.tagName) 
                && this.css('position') == 'static'){
                offsetParent = offsetParent.offsetParent;
            }
            
            offsetParent = create(offsetParent);

            var parentOffset = 
                /^body|html$/i.test(offsetParent.dom.tagName) ? 
                { top: 0, left: 0} : offsetParent.offset();

            offset.top -= Element.parseCssValue(this.css('margin-top'));
            offset.left -= Element.parseCssValue(this.css('margin-left'));
            parentOffset.top += 
                Element.parseCssValue(offsetParent.css('border-top-width'));
            parentOffset.left += 
                Element.parseCssValue(offsetParent.css('border-left-width'));

            return {
                top: offset.top - parentOffset.top,
                left: offset.left - parentOffset.left
            };
        },

        /**
         * 元素距离当前场景的位置
         * @return {Object}
         */
        offset: function() {
            var box = this.dom.getBoundingClientRect();
            var top = box.top + pageYOffset;
            var left = box.left + pageXOffset;

            return { top: top, left: left };
        },

        /**
         * 设置与获取宽度(单位px)
         * @return {Number} val
         */
        width: function(val) {
            if (val !== undefined)
                this.dom.style.width = (typeof val == 'string' ? val : val + 'px');
            else
                return this.dom.clientWidth;
        },

        /**
         * 设置与获取高度，设置时会返回自身
         * @return {Number} val
         */
        height: function(val) {
            if (val !== undefined)
                this.dom.style.height = (typeof val == 'string' ? val : val + 'px');
            else
                return this.dom.clientHeight;
        },

        /**
         * 返回父级元素
         * @param {String} exp 查询表达式
         * @return {Jsx.dom.Element} 返回结果
         */
        parent: function(exp) {
            var parent = this.dom.parentNode;
            return query(top(parent), [parent], exp)[0] || null;
        },

        /**
         * 查询父级元素，直到匹配相应的元素
         * @param {String} exp 查询表达式
         * @return {Jsx.dom.Element} 返回结果
         */
        closest: function(exp) {
            var dom = this.dom;
            var ls = [];
            while (dom = dom.parentNode) {
                ls = query(top(dom), [dom], exp);
                if (ls.length)
                    break;
            }
            return ls[0] || null;
        },

        /**
         * 在当前作用域内（当前所属控件管理的范围）,
         * 查询后代元素，慎用，频繁使用会导致效率问题
         * @param  {String}            exp 查询表达式
         * @return {Jsx.dom.Element[]}
         */
        find: function(exp) {
            var ls = [];
            find(this.dom, ls);
            return query(this.Control ? this : this.top, ls, exp);
        },

        /**
         * 查询子元素
         * @param {String} exp 查询表达式
         * @return {Jsx.dom.Element[]} 返回结果
         */
        children: function(exp) {
            var ns = this.dom.childNodes, ls = [];
            for (var i = 0, e; (e = ns[i]); i++) {
                if (e.nodeType == 1)
                    ls.push(e);
            }
            return query(this.Control ? this : this.top, ls, exp);
        },

        /**
         * 上一个节点
         * @param {String} exp 查询表达式
         * @return {Jsx.dom.Element} 返回结果
         */
        prev: function(exp) {
            var prev = this.dom.previousSibling;
            return query(
                this.top, 
                [prev && (prev.nodeType == 1 ? prev : prev.previousSibling)], 
                exp)[0] || null;
        },

        /**
         * 下一个节点
         * @param {String} exp 查询表达式
         * @return {Jsx.dom.Element} 返回结果
         */
        next: function(exp) {
            var next = this.dom.nextSibling;
            return query(
                this.top, 
                [next && (next.nodeType == 1 ? next : next.nextSibling)], 
                exp)[0] || null;
        },

        /**
         * 兄弟元素中的第一个
         * @param {String} exp 查询表达式
         * @return {Jsx.dom.Element} 返回结果
         */
        first: function(exp) {
            var parent = this.dom.parentNode;
            return query(
                this.top, 
                [parent && parent.firstChild && (parent.firstChild.nodeType == 1 ?
                parent.firstChild : parent.firstChild.nextSibling)], exp)[0] || null;
        },

        /**
         * 兄弟元素中的最后一个
         * @param {String} exp 查询表达式
         * @return {Jsx.dom.Element} 返回结果
         */
        last: function(exp) {
            var parent = this.dom.parentNode;
            return query(
                this.top, 
                [parent && parent.lastChild && (parent.lastChild.nodeType == 1 ?
                parent.lastChild : parent.lastChild.previousSibling)], exp)[0] || null;
        },

        /**
         * 设置或获取html,慎用,会覆盖子控件 
         * @param  {String} html
         * @return {Object}
         */
        html: function(html) {
            var dom = this.dom;
            if (html !== undefined) {
                empty(this);
                dom.innerHTML = html;
            }
            else
                return dom.innerHTML;
        },

        /**
         * 获取与设置值，如果设置值时会返回自身
         * @param {String} val (Optional) 要设置的值
         * @return {Object}
         */
        value: function(val) {
            var dom = this.dom;
            if (val !== undefined)
                dom.value = val;
            else
                return dom.value;
        },

        /**
         * 获取与设置text,如果设置值时会返回自身
         * @param  {String} txt (Optional) 要设置的文本
         * @return {String}
         */
        text: function(txt) {
            var dom = this.dom;
            if (txt !== undefined) {
                empty(this);
                dom.textContent = txt;
            }
            else
                return text(dom);
        },

        /**
         * 追加元素至结尾
         * 可添加 Html、HTMLElement、Jsx.Element
         * param {Object} obj 要追加的元素
         */
        append: function(obj) {
            var dom = this.dom;
            var el = create(obj);
            var child;

            if (el) {
                child = el.dom;
                addChild(this.Control ? this : this.top, el);
            }
            else
                child = DOC.createTextNode(String(obj));
            dom.appendChild(child);
        },

        /**
         * 前置元素
         * param {Object} obj 要前置的元素
         */
        prepend: function(obj) {
            var dom = this.dom;
            var el = create(obj);
            var child;

            if (el) {
                child = el.dom;
                addChild(this.Control ? this : this.top, el);
            }
            else child = DOC.createTextNode(String(obj));
            dom.firstChild ? 
                dom.insertBefore(child, dom.firstChild) : dom.appendChild(child);
        },

        /**
         * 插入前
         * param {Object} obj 要插入的元素
         */
        before: function(obj) {
            var dom = this.dom;
            var parent = e.parentNode;
            var el = create(obj);
            var sb;

            if (parent) {
                if (el) {
                    sb = el.dom;
                    addChild(this.top, el);
                }
                else sb = DOC.createTextNode(String(obj));
                parent.insertBefore(sb, dom);
            }
        },

        /**
         * 插入后
         * param {Jsx.Base} obj 要插入的元素
         */
        after: function(obj) {
            var dom = this.dom;
            var parent = dom.parentNode;
            var el = create(obj);
            var sb;

            if (parent) {
                if (el) {
                    sb = el.dom;
                    addChild(this.top, el);
                }
                else sb = DOC.createTextNode(String(obj));
                dom.nextSibling ? 
                    parent.insertBefore(sb, dom.nextSibling) : parent.appendChild(sb);
            }
        },

        /**
         * 删除当前元素
         */
        remove: function() {
            var dom = this.dom;
            var parent = dom.parentNode;

            remove(this);
            if (parent)
                parent.removeChild(dom);
        },

        /**
         * 删除元素中所有的子节点
         */
        empty: function() {
            empty(this);
            this.dom.textContent = '';
        }

    }, {

        CSS_PREFIX: '',                  //CSS前缀
        CSS_PREFIX_ITEM: [],             //要修复的前缀

        /**
         * 创建Element对像
         * @static
         * @param  {Object}            o  可以为 Html、
         * HTMLElement、Jsx.Element、中的任意一个
         * @return {Jsx.dom.Element}        返回结果
         */
        create: function(o) {
            return create(o) || query(null, find(html, [html]), o)[0] || null;
        },

        /**
         * 解析css属性名称
         * @param {String} name 要解析的名称
         * @static
         * @return 返回解析后的名称
         */
        parseCssName: function(name) {
            var Element = Jsx.dom.Element;
            if (name == 'float')
                return CSS_FLOAT;

            var mat = REGEXP.exec(name);
            if (mat && !mat[1])
                name = CSS_PREFIX + name;

            var reg = /-([a-z])/ig;
            return name.replace(reg, function(all, i) { return i.toUpperCase() });
        },

        /**
         * 解析css属性值（转换为数字）
         * @param {String} value 要解析的值
         * @static
         * @return 返回解析后浮点数
         */
        parseCssValue: function(value) {
            if (value.constructor === Number)
                return value;
            else {
                if(value.constructor !== String) {
                    value += '';
                }
                return parseFloat(value.replace(/[^0-9]/gm, ''));
            }
        }
    });

    Element.CSS_PREFIX = 
        CSS_PREFIX.replace(/^./, function(i) { return '-' + i.toLowerCase() });

    global.$ = Element.create;

    if (!getComputedStyle)
        return;

    var styles = getComputedStyle(html, null);
    var items = [
        'radius',
        'borderRadius',
        'transform',
        'transform',
        'box-?shadow',
        'boxShadow',
        'column',
        'columnCount',
        'box-?sizing',
        'boxSizing',
        'user-?select',
        'userSelect',
        'animation',
        'animation',
        'transition',
        'transition',
        'keyframes',
        'animation'
    ];

    for (var i = 0, len = items.length; i < len; i += 2) {
        if (styles[items[i + 1]] === undefined)
            Element.CSS_PREFIX_ITEM.push(items[i]);
    }

    //css float 属性 名称 
    var CSS_FLOAT = styles.cssFloat ? 'cssFloat' : 'styleFloat';
    var REGEXP = 
        new RegExp('^(' + Element.CSS_PREFIX + 
        ')?.*(' + Element.CSS_PREFIX_ITEM.join('|') + ')', 'i');

});