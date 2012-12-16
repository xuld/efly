/* vim:ts=4:sts=4:sw=4:
* ***** BEGIN LICENSE BLOCK *****
* Version: MPL 1.1/GPL 2.0/LGPL 2.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is Ajax.org Code Editor (ACE).
*
* The Initial Developer of the Original Code is
* Ajax.org B.V.
* Portions created by the Initial Developer are Copyright (C) 2010
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
*      Fabian Jakobs <fabian AT ajax DOT org>
*      Mihai Sucan <mihai AT sucan AT gmail ODT com>
*      Irakli Gozalishvili <rfobic@gmail.com> (http://jeditoolkit.com)
*
* Alternatively, the contents of this file may be used under the terms of
* either the GNU General Public License Version 2 or later (the "GPL"), or
* the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
* in which case the provisions of the GPL or the LGPL are applicable instead
* of those above. If you wish to allow use of your version of this file only
* under the terms of either the GPL or the LGPL, and not to allow others to
* use your version of this file under the terms of the MPL, indicate your
* decision by deleting the provisions above and replace them with the notice
* and other provisions required by the GPL or the LGPL. If you do not delete
* the provisions above, a recipient may use your version of this file under
* the terms of any one of the MPL, the GPL or the LGPL.
*
* ***** END LICENSE BLOCK ***** */

define(function() {

    var XHTML_NS = "http://www.w3.org/1999/xhtml";

    var Dom =

    Class('ace.lib.Dom', null, null, {

        createElement: function(tag, ns) {
            return document.createElementNS ?
               document.createElementNS(ns || XHTML_NS, tag) :
               document.createElement(tag);
        },

        setText: function(elem, text) {
            if (elem.innerText !== undefined) {
                elem.innerText = text;
            }
            if (elem.textContent !== undefined) {
                elem.textContent = text;
            }
        },

        /**
        * Add or remove a CSS class from the list of classes on the given node
        * depending on the value of <tt>include</tt>
        */
        setCssClass: function(node, className, include) {
            if (include) {
                Dom.addCssClass(node, className);
            } else {
                Dom.removeCssClass(node, className);
            }
        },

        hasCssString: function(id, doc) {
            var index = 0, sheets;
            doc = doc || document;

            if (doc.createStyleSheet && (sheets = doc.styleSheets)) {
                while (index < sheets.length)
                    if (sheets[index++].title === id) return true;
            } else if ((sheets = doc.getElementsByTagName("style"))) {
                while (index < sheets.length)
                    if (sheets[index++].id === id) return true;
            }

            return false;
        },

        importCssString: function(cssText, id, doc) {

            doc = doc || document;
            // If style is already imported return immediately.
            if (id && Dom.hasCssString(id, doc))
                return null;

            var style;

            if (doc.createStyleSheet) {
                style = doc.createStyleSheet();
                style.cssText = cssText;
                if (id)
                    style.title = id;
            } else {
                style = doc.createElementNS ?
                    doc.createElementNS(XHTML_NS, "style") :
                    doc.createElement("style");

                style.setAttribute('type', 'text/css');
                style.appendChild(doc.createTextNode(cssText));
                if (id)
                    style.id = id;

                var head = doc.getElementsByTagName("head")[0] || doc.documentElement;
                head.appendChild(style);
            }
        },

        importCssStylsheet: function(uri, doc) {
            if (doc.createStyleSheet) {
                doc.createStyleSheet(uri);
            } else {
                var link = Dom.createElement('link');
                link.rel = 'stylesheet';
                link.href = uri;

                var head = doc.getElementsByTagName("head")[0] || doc.documentElement;
                head.appendChild(link);
            }
        },

        getInnerWidth: function(element) {
            return (
                parseInt(Dom.computedStyle(element, "paddingLeft"), 10) +
                parseInt(Dom.computedStyle(element, "paddingRight"), 10) +
                element.clientWidth
            );
        },

        getInnerHeight: function(element) {
            return (
                parseInt(Dom.computedStyle(element, "paddingTop"), 10) +
                parseInt(Dom.computedStyle(element, "paddingBottom"), 10) +
                element.clientHeight
            );
        },

        scrollbarWidth: function(document) {

            var inner = Dom.createElement("p");
            inner.style.width = "100%";
            inner.style.minWidth = "0px";
            inner.style.height = "200px";

            var outer = Dom.createElement("div");
            var style = outer.style;

            style.position = "absolute";
            style.left = "-10000px";
            style.overflow = "hidden";
            style.width = "200px";
            style.minWidth = "0px";
            style.height = "150px";

            outer.appendChild(inner);

            var body = document.body || document.documentElement;
            body.appendChild(outer);

            var noScrollbar = inner.offsetWidth;

            style.overflow = "scroll";
            var withScrollbar = inner.offsetWidth;

            if (noScrollbar == withScrollbar) {
                withScrollbar = outer.clientWidth;
            }

            body.removeChild(outer);

            return noScrollbar - withScrollbar;
        },

        /**
        * Optimized set innerHTML. This is faster than plain innerHTML if the element
        * already contains a lot of child elements.
        *
        * See http://blog.stevenlevithan.com/archives/faster-than-innerhtml for details
        */
        setInnerHtml: function(el, innerHtml) {
            var element = el.cloneNode(false); //document.createElement("div");
            element.innerHTML = innerHtml;
            el.parentNode.replaceChild(element, el);
            return element;
        },

        setInnerText: function(el, innerText) {
            var document = el.ownerDocument;
            if (document.body && "textContent" in document.body)
                el.textContent = innerText;
            else
                el.innerText = innerText;

        },

        getInnerText: function(el) {
            var document = el.ownerDocument;
            if (document.body && "textContent" in document.body)
                return el.textContent;
            else
                return el.innerText || el.textContent || "";
        },

        getParentWindow: function(document) {
            return document.defaultView || document.parentWindow;
        }

    });


    if (!document.documentElement.classList) {
        Dom.hasCssClass = function(el, name) {
            var classes = el.className.split(/\s+/g);
            return classes.indexOf(name) !== -1;
        };

        /**
        * Add a CSS class to the list of classes on the given node
        */
        Dom.addCssClass = function(el, name) {
            if (!Dom.hasCssClass(el, name)) {
                el.className += " " + name;
            }
        };

        /**
        * Remove a CSS class from the list of classes on the given node
        */
        Dom.removeCssClass = function(el, name) {
            var classes = el.className.split(/\s+/g);
            while (true) {
                var index = classes.indexOf(name);
                if (index == -1) {
                    break;
                }
                classes.splice(index, 1);
            }
            el.className = classes.join(" ");
        };

        Dom.toggleCssClass = function(el, name) {
            var classes = el.className.split(/\s+/g), add = true;
            while (true) {
                var index = classes.indexOf(name);
                if (index == -1) {
                    break;
                }
                add = false;
                classes.splice(index, 1);
            }
            if (add)
                classes.push(name);

            el.className = classes.join(" ");
            return add;
        };
    } else {
        Dom.hasCssClass = function(el, name) {
            return el.classList.contains(name);
        };

        Dom.addCssClass = function(el, name) {
            el.classList.add(name);
        };

        Dom.removeCssClass = function(el, name) {
            el.classList.remove(name);
        };

        Dom.toggleCssClass = function(el, name) {
            return el.classList.toggle(name);
        };
    }

    if (window.pageYOffset !== undefined) {
        Dom.getPageScrollTop = function() {
            return window.pageYOffset;
        };

        Dom.getPageScrollLeft = function() {
            return window.pageXOffset;
        };
    }
    else {
        Dom.getPageScrollTop = function() {
            return document.body.scrollTop;
        };

        Dom.getPageScrollLeft = function() {
            return document.body.scrollLeft;
        };
    }

    if (window.getComputedStyle)
        Dom.computedStyle = function(element, style) {
            if (style)
                return (window.getComputedStyle(element, "") || {})[style] || "";
            return window.getComputedStyle(element, "") || {};
        };
    else
        Dom.computedStyle = function(element, style) {
            if (style)
                return element.currentStyle[style];
            return element.currentStyle;
        };

});
