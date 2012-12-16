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
*      Fabian Jakobs <fabian@ajax.org>
*      Irakli Gozalishvili <rfobic@gmail.com> (http://jeditoolkit.com)
*      Julian Viereck <julian.viereck@gmail.com>
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

include('Jsx/Util.js');
include('ace/lib/Dom.js');
include('ace/lib/Event.js');
include('ace/lib/UserAgent.js');
include('ace/layer/Gutter.js');
include('ace/layer/Marker.js');
include('ace/layer/Text.js');
include('ace/layer/Cursor.js');
include('ace/ScrollBar.js');
include('ace/RenderLoop.js');
include('ace/lib/EventEmitter.js');
include('ace/css/Editor.js');
include('ace/theme/Textmate.js');

define(function() {

    var dom = ace.lib.Dom;
    var event = ace.lib.Event;
    var useragent = ace.lib.UserAgent;
    var GutterLayer = ace.layer.Gutter;
    var MarkerLayer = ace.layer.Marker;
    var TextLayer = ace.layer.Text;
    var CursorLayer = ace.layer.Cursor;
    var ScrollBar = ace.ScrollBar;
    var RenderLoop = ace.RenderLoop;

    Class('ace.VirtualRenderer', ace.lib.EventEmitter, {

        showGutter: true,

        CHANGE_CURSOR: 1,
        CHANGE_MARKER: 2,
        CHANGE_GUTTER: 4,
        CHANGE_SCROLL: 8,
        CHANGE_LINES: 16,
        CHANGE_TEXT: 32,
        CHANGE_SIZE: 64,
        CHANGE_MARKER_BACK: 128,
        CHANGE_MARKER_FRONT: 256,
        CHANGE_FULL: 512,

        VirtualRenderer: function(container, theme) {
            this.container = container;

            // TODO: this breaks rendering in Cloud9 with multiple ace instances
            //    // Imports CSS once per DOM document ('ace_editor' serves as an identifier).
            //    dom.importCssString(editorCss, "ace_editor", container.ownerDocument);

            // Chrome has some strange rendering issues if this is not done async

            setTimeout(function() {
                dom.addCssClass(container, "ace_editor");
            }, 0)

            this.setTheme(theme);

            this.$gutter = dom.createElement("div");
            this.$gutter.className = "ace_gutter";
            this.container.appendChild(this.$gutter);

            this.scroller = dom.createElement("div");
            this.scroller.className = "ace_scroller";
            this.container.appendChild(this.scroller);

            this.content = dom.createElement("div");
            this.content.className = "ace_content";
            this.scroller.appendChild(this.content);

            this.$gutterLayer = new GutterLayer(this.$gutter);
            this.$markerBack = new MarkerLayer(this.content);

            var textLayer = this.$textLayer = new TextLayer(this.content);
            this.canvas = textLayer.element;

            this.$markerFront = new MarkerLayer(this.content);

            this.characterWidth = textLayer.getCharacterWidth();
            this.lineHeight = textLayer.getLineHeight();

            this.$cursorLayer = new CursorLayer(this.content);
            this.$cursorPadding = 8;

            // Indicates whether the horizontal scrollbar is visible
            this.$horizScroll = true;
            this.$horizScrollAlwaysVisible = true;

            this.scrollBar = new ScrollBar(container);
            this.scrollBar.addEventListener("scroll", this.onScroll.bind(this));

            this.scrollTop = 0;

            this.cursorPos = {
                row: 0,
                column: 0
            };

            var _self = this;
            this.$textLayer.addEventListener("changeCharaterSize", function() {
                _self.characterWidth = textLayer.getCharacterWidth();
                _self.lineHeight = textLayer.getLineHeight();
                _self.$updatePrintMargin();
                _self.onResize();

                _self.$loop.schedule(_self.CHANGE_FULL);
            });
            event.addListener(this.$gutter, "click", this.$onGutterClick.bind(this));
            event.addListener(this.$gutter, "dblclick", this.$onGutterClick.bind(this));

            this.$size = {
                width: 0,
                height: 0,
                scrollerHeight: 0,
                scrollerWidth: 0
            };

            this.layerConfig = {
                width: 1,
                padding: 0,
                firstRow: 0,
                firstRowScreen: 0,
                lastRow: 0,
                lineHeight: 1,
                characterWidth: 1,
                minHeight: 1,
                maxHeight: 1,
                offset: 0,
                height: 1
            };

            this.$loop = new RenderLoop(
                this.$renderChanges.bind(this),
                this.container.ownerDocument.defaultView
            );
            this.$loop.schedule(this.CHANGE_FULL);

            this.setPadding(4);
            this.$updatePrintMargin();
        },

        setSession: function(session) {
            this.session = session;
            this.$cursorLayer.setSession(session);
            this.$markerBack.setSession(session);
            this.$markerFront.setSession(session);
            this.$gutterLayer.setSession(session);
            this.$textLayer.setSession(session);
            this.$loop.schedule(this.CHANGE_FULL);
        },

        /**
        * Triggers partial update of the text layer
        */
        updateLines: function(firstRow, lastRow) {
            if (lastRow === undefined)
                lastRow = Infinity;

            if (!this.$changedLines) {
                this.$changedLines = {
                    firstRow: firstRow,
                    lastRow: lastRow
                };
            }
            else {
                if (this.$changedLines.firstRow > firstRow)
                    this.$changedLines.firstRow = firstRow;

                if (this.$changedLines.lastRow < lastRow)
                    this.$changedLines.lastRow = lastRow;
            }

            this.$gutterLayer.setBreakpoints(this.session.getBreakpoints());
            this.$gutterLayer.setBreak(this.session.getBreak().row);
            this.$loop.schedule(this.CHANGE_LINES);
        },

        /**
        * Triggers full update of the text layer
        */
        updateText: function() {
            this.$loop.schedule(this.CHANGE_TEXT);
        },

        /**
        * Triggers a full update of all layers
        */
        updateFull: function() {
            this.$loop.schedule(this.CHANGE_FULL);
        },

        updateFontSize: function() {
            this.$textLayer.checkForSizeChanges();
        },

        /**
        * Triggers resize of the editor
        */
        onResize: function() {

            var changes = this.CHANGE_SIZE;
            var size = this.$size;

            var height = dom.getInnerHeight(this.container);

            if (!size.scrollerHeight || size.height != height) {
                size.height = height;
                this.scroller.style.height = height + "px";
                size.scrollerHeight = this.scroller.clientHeight;
                this.scrollBar.setHeight(size.scrollerHeight);

                if (this.session) {
                    this.scrollToY(this.getScrollTop());
                    changes = changes | this.CHANGE_FULL;
                }
            }

            var width = dom.getInnerWidth(this.container);
            if (!size.scrollerWidth || size.width != width) {
                size.width = width;

                var gutterWidth = this.showGutter ? this.$gutter.offsetWidth : 0;
                this.scroller.style.left = gutterWidth + "px";
                size.scrollerWidth = Math.max(0, width - gutterWidth - this.scrollBar.getWidth())
                this.scroller.style.width = size.scrollerWidth + "px";

                if (this.session.getUseWrapMode() && this.adjustWrapLimit())
                    changes = changes | this.CHANGE_FULL;
            }

            this.$loop.schedule(changes);
        },

        adjustWrapLimit: function() {
            var availableWidth = this.$size.scrollerWidth - this.$padding * 2;
            var limit = Math.floor(availableWidth / this.characterWidth) - 1;
            return this.session.adjustWrapLimit(limit);
        },

        $onGutterClick: function(e) {
            var pageY = event.getDocumentY(e);
            var row = this.screenToTextCoordinates(0, pageY).row;

            if (e.target.className.indexOf('ace_fold-widget') != -1)
                return this.session.onFoldWidgetClick(row, e);

            this._dispatchEvent("gutter" + e.type, {
                row: row,
                htmlEvent: e
            });
        },

        setShowInvisibles: function(showInvisibles) {
            if (this.$textLayer.setShowInvisibles(showInvisibles))
                this.$loop.schedule(this.CHANGE_TEXT);
        },

        getShowInvisibles: function() {
            return this.$textLayer.showInvisibles;
        },

        $showPrintMargin: true,
        setShowPrintMargin: function(showPrintMargin) {
            this.$showPrintMargin = showPrintMargin;
            this.$updatePrintMargin();
        },

        getShowPrintMargin: function() {
            return this.$showPrintMargin;
        },

        $printMarginColumn: 80,
        setPrintMarginColumn: function(showPrintMargin) {
            this.$printMarginColumn = showPrintMargin;
            this.$updatePrintMargin();
        },

        getPrintMarginColumn: function() {
            return this.$printMarginColumn;
        },

        getShowGutter: function() {
            return this.showGutter;
        },

        setShowGutter: function(show) {
            if (this.showGutter === show)
                return;
            this.$gutter.style.display = show ? "block" : "none";
            this.showGutter = show;
            this.onResize();
        },

        $updatePrintMargin: function() {
            var containerEl;

            if (!this.$showPrintMargin && !this.$printMarginEl)
                return;

            if (!this.$printMarginEl) {
                containerEl = dom.createElement("div");
                containerEl.className = "ace_print_margin_layer";
                this.$printMarginEl = dom.createElement("div");
                this.$printMarginEl.className = "ace_print_margin";
                containerEl.appendChild(this.$printMarginEl);
                this.content.insertBefore(containerEl, this.$textLayer.element);
            }

            var style = this.$printMarginEl.style;
            style.left = ((this.characterWidth * this.$printMarginColumn) + this.$padding * 2) + "px";
            style.visibility = this.$showPrintMargin ? "visible" : "hidden";
        },

        getContainerElement: function() {
            return this.container;
        },

        getMouseEventTarget: function() {
            return this.content;
        },

        getTextAreaContainer: function() {
            return this.container;
        },

        moveTextAreaToCursor: function(textarea) {
            // in IE the native cursor always shines through
            // this persists in IE9
            if (useragent.isIE)
                return;

            var pos = this.$cursorLayer.getPixelPosition();
            if (!pos)
                return;

            var bounds = this.content.getBoundingClientRect();
            var offset = this.layerConfig.offset;

            textarea.style.left = (bounds.left + pos.left + this.$padding) + "px";
            textarea.style.top = (bounds.top + pos.top - this.scrollTop + offset) + "px";
        },

        getFirstVisibleRow: function() {
            return this.layerConfig.firstRow;
        },

        getFirstFullyVisibleRow: function() {
            return this.layerConfig.firstRow + (this.layerConfig.offset === 0 ? 0 : 1);
        },

        getLastFullyVisibleRow: function() {
            var flint = Math.floor((this.layerConfig.height + this.layerConfig.offset) / this.layerConfig.lineHeight);
            return this.layerConfig.firstRow - 1 + flint;
        },

        getLastVisibleRow: function() {
            return this.layerConfig.lastRow;
        },

        $padding: null,
        setPadding: function(padding) {
            this.$padding = padding;
            this.$textLayer.setPadding(padding);
            this.$cursorLayer.setPadding(padding);
            this.$markerFront.setPadding(padding);
            this.$markerBack.setPadding(padding);
            this.$loop.schedule(this.CHANGE_FULL);
            this.$updatePrintMargin();
        },

        getHScrollBarAlwaysVisible: function() {
            return this.$horizScrollAlwaysVisible;
        },

        setHScrollBarAlwaysVisible: function(alwaysVisible) {
            if (this.$horizScrollAlwaysVisible != alwaysVisible) {
                this.$horizScrollAlwaysVisible = alwaysVisible;
                if (!this.$horizScrollAlwaysVisible || !this.$horizScroll)
                    this.$loop.schedule(this.CHANGE_SCROLL);
            }
        },

        onScroll: function(e) {
            this.scrollToY(e.data);
        },

        $updateScrollBar: function() {
            this.scrollBar.setInnerHeight(this.layerConfig.maxHeight);
            this.scrollBar.setScrollTop(this.scrollTop);
        },

        $renderChanges: function(changes) {
            if (!changes || !this.session)
                return;

            // text, scrolling and resize changes can cause the view port size to change
            if (changes & this.CHANGE_FULL ||
                changes & this.CHANGE_SIZE ||
                changes & this.CHANGE_TEXT ||
                changes & this.CHANGE_LINES ||
                changes & this.CHANGE_SCROLL
            )
                this.$computeLayerConfig();

            // full
            if (changes & this.CHANGE_FULL) {
                this.$textLayer.update(this.layerConfig);
                if (this.showGutter)
                    this.$gutterLayer.update(this.layerConfig);
                this.$markerBack.update(this.layerConfig);
                this.$markerFront.update(this.layerConfig);
                this.$cursorLayer.update(this.layerConfig);
                this.$updateScrollBar();
                return;
            }

            // scrolling
            if (changes & this.CHANGE_SCROLL) {
                //console.log('A');

                if (changes & this.CHANGE_TEXT || changes & this.CHANGE_LINES)
                    this.$textLayer.update(this.layerConfig);
                else
                    this.$textLayer.scrollLines(this.layerConfig);

                if (this.showGutter)
                    this.$gutterLayer.update(this.layerConfig);
                this.$markerBack.update(this.layerConfig);
                this.$markerFront.update(this.layerConfig);
                this.$cursorLayer.update(this.layerConfig);
                this.$updateScrollBar();
                return;
            }

            if (changes & this.CHANGE_TEXT) {
                this.$textLayer.update(this.layerConfig);
                if (this.showGutter)
                    this.$gutterLayer.update(this.layerConfig);
            }
            else if (changes & this.CHANGE_LINES) {
                this.$updateLines();
                this.$updateScrollBar();
                if (this.showGutter)
                    this.$gutterLayer.update(this.layerConfig);
            } else if (changes & this.CHANGE_GUTTER) {
                if (this.showGutter)
                    this.$gutterLayer.update(this.layerConfig);
            }

            if (changes & this.CHANGE_CURSOR)
                this.$cursorLayer.update(this.layerConfig);

            if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_FRONT)) {
                this.$markerFront.update(this.layerConfig);
            }

            if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_BACK)) {
                this.$markerBack.update(this.layerConfig);
            }

            if (changes & this.CHANGE_SIZE)
                this.$updateScrollBar();
        },

        $computeLayerConfig: function() {
            var session = this.session;

            var offset = this.scrollTop % this.lineHeight;
            var minHeight = this.$size.scrollerHeight + this.lineHeight;

            var longestLine = this.$getLongestLine();
            var widthChanged = this.layerConfig.width != longestLine;

            var horizScroll = this.$horizScrollAlwaysVisible || this.$size.scrollerWidth - longestLine < 0;
            var horizScrollChanged = this.$horizScroll !== horizScroll;
            this.$horizScroll = horizScroll;
            if (horizScrollChanged)
                this.scroller.style.overflowX = horizScroll ? "scroll" : "hidden";

            var maxHeight = this.session.getScreenLength() * this.lineHeight;
            this.scrollTop = Math.max(0, Math.min(this.scrollTop, maxHeight - this.$size.scrollerHeight));

            var lineCount = Math.ceil(minHeight / this.lineHeight) - 1;
            var firstRow = Math.max(0, Math.round((this.scrollTop - offset) / this.lineHeight));
            var lastRow = firstRow + lineCount;

            // Map lines on the screen to lines in the document.
            var firstRowScreen, firstRowHeight;
            var lineHeight = { lineHeight: this.lineHeight };
            firstRow = session.screenToDocumentRow(firstRow, 0);

            // Check if firstRow is inside of a foldLine. If true, then use the first
            // row of the foldLine.
            var foldLine = session.getFoldLine(firstRow);
            if (foldLine) {
                firstRow = foldLine.start.row;
            }

            firstRowScreen = session.documentToScreenRow(firstRow, 0);
            firstRowHeight = session.getRowHeight(lineHeight, firstRow);

            lastRow = Math.min(session.screenToDocumentRow(lastRow, 0), session.getLength() - 1);
            minHeight = this.$size.scrollerHeight + session.getRowHeight(lineHeight, lastRow) +
                                                firstRowHeight;

            offset = this.scrollTop - firstRowScreen * this.lineHeight;

            this.layerConfig = {
                width: longestLine,
                padding: this.$padding,
                firstRow: firstRow,
                firstRowScreen: firstRowScreen,
                lastRow: lastRow,
                lineHeight: this.lineHeight,
                characterWidth: this.characterWidth,
                minHeight: minHeight,
                maxHeight: maxHeight,
                offset: offset,
                height: this.$size.scrollerHeight
            };

            // For debugging.
            // console.log(JSON.stringify(this.layerConfig));

            this.$gutterLayer.element.style.marginTop = (-offset) + "px";
            this.content.style.marginTop = (-offset) + "px";
            this.content.style.width = longestLine + "px";
            this.content.style.height = minHeight + "px";

            // scroller.scrollWidth was smaller than scrollLeft we needed
            if (this.$desiredScrollLeft) {
                this.scrollToX(this.$desiredScrollLeft);
                this.$desiredScrollLeft = 0;
            }

            // Horizontal scrollbar visibility may have changed, which changes
            // the client height of the scroller
            if (horizScrollChanged)
                this.onResize();
        },

        $updateLines: function() {
            var firstRow = this.$changedLines.firstRow;
            var lastRow = this.$changedLines.lastRow;
            this.$changedLines = null;

            var layerConfig = this.layerConfig;

            // if the update changes the width of the document do a full redraw
            if (layerConfig.width != this.$getLongestLine())
                return this.$textLayer.update(layerConfig);

            if (firstRow > layerConfig.lastRow + 1) { return; }
            if (lastRow < layerConfig.firstRow) { return; }

            // if the last row is unknown -> redraw everything
            if (lastRow === Infinity) {
                if (this.showGutter)
                    this.$gutterLayer.update(layerConfig);
                this.$textLayer.update(layerConfig);
                return;
            }

            // else update only the changed rows
            this.$textLayer.updateLines(layerConfig, firstRow, lastRow);
        },

        $getLongestLine: function() {
            var charCount = this.session.getScreenWidth() + 1;
            if (this.$textLayer.showInvisibles)
                charCount += 1;

            return Math.max(this.$size.scrollerWidth, Math.round(charCount * this.characterWidth));
        },

        updateFrontMarkers: function() {
            this.$markerFront.setMarkers(this.session.getMarkers(true));
            this.$loop.schedule(this.CHANGE_MARKER_FRONT);
        },

        updateBackMarkers: function() {
            this.$markerBack.setMarkers(this.session.getMarkers());
            this.$loop.schedule(this.CHANGE_MARKER_BACK);
        },

        addGutterDecoration: function(row, className) {
            this.$gutterLayer.addGutterDecoration(row, className);
            this.$loop.schedule(this.CHANGE_GUTTER);
        },

        removeGutterDecoration: function(row, className) {
            this.$gutterLayer.removeGutterDecoration(row, className);
            this.$loop.schedule(this.CHANGE_GUTTER);
        },

        setBreakpoints: function(rows) {
            this.$gutterLayer.setBreakpoints(rows);
            this.$loop.schedule(this.CHANGE_GUTTER);
        },

        setBreak: function(row) {
            this.$gutterLayer.setBreak(row);
            this.$loop.schedule(this.CHANGE_GUTTER);
        },

        setAnnotations: function(annotations) {
            this.$gutterLayer.setAnnotations(annotations);
            this.$loop.schedule(this.CHANGE_GUTTER);
        },

        updateCursor: function() {
            this.$loop.schedule(this.CHANGE_CURSOR);
        },

        hideCursor: function() {
            this.$cursorLayer.hideCursor();
        },

        showCursor: function() {
            this.$cursorLayer.showCursor();
        },

        scrollCursorIntoView: function() {
            // the editor is not visible
            if (this.$size.scrollerHeight === 0)
                return;

            var pos = this.$cursorLayer.getPixelPosition();

            var left = pos.left;
            var top = pos.top;

            if (this.scrollTop > top) {
                this.scrollToY(top);
            }

            if (this.scrollTop + this.$size.scrollerHeight < top + this.lineHeight) {
                this.scrollToY(top + this.lineHeight - this.$size.scrollerHeight);
            }

            var scrollLeft = this.scroller.scrollLeft;

            if (scrollLeft > left) {
                this.scrollToX(left);
            }

            if (scrollLeft + this.$size.scrollerWidth < left + this.characterWidth) {
                if (left > this.layerConfig.width)
                    this.$desiredScrollLeft = left + 2 * this.characterWidth;
                else
                    this.scrollToX(Math.round(left + this.characterWidth - this.$size.scrollerWidth));
            }
        },

        getScrollTop: function() {
            return this.scrollTop;
        },

        getScrollLeft: function() {
            return this.scroller.scrollLeft;
        },

        getScrollTopRow: function() {
            return this.scrollTop / this.lineHeight;
        },

        getScrollBottomRow: function() {
            return Math.max(0, Math.floor((this.scrollTop + this.$size.scrollerHeight) / this.lineHeight) - 1);
        },

        scrollToRow: function(row) {
            this.scrollToY(row * this.lineHeight);
        },

        scrollToLine: function(line, center) {
            var lineHeight = { lineHeight: this.lineHeight };
            var offset = 0;
            for (var l = 1; l < line; l++) {
                offset += this.session.getRowHeight(lineHeight, l - 1);
            }

            if (center) {
                offset -= this.$size.scrollerHeight / 2;
            }
            this.scrollToY(offset);
        },

        scrollToY: function(scrollTop) {
            // after calling scrollBar.setScrollTop
            // scrollbar sends us event with same scrollTop. ignore it
            scrollTop = Math.max(0, scrollTop);
            if (this.scrollTop !== scrollTop) {
                this.$loop.schedule(this.CHANGE_SCROLL);
                this.scrollTop = scrollTop;
            }
        },

        scrollToX: function(scrollLeft) {
            if (scrollLeft <= this.$padding)
                scrollLeft = 0;

            this.scroller.scrollLeft = scrollLeft;
        },

        scrollBy: function(deltaX, deltaY) {
            deltaY && this.scrollToY(this.scrollTop + deltaY);
            deltaX && this.scrollToX(this.scroller.scrollLeft + deltaX);
        },

        isScrollableBy: function(deltaX, deltaY) {
            if (deltaY < 0 && this.scrollTop > 0)
                return true;
            if (deltaY > 0 && this.scrollTop + this.$size.scrollerHeight < this.layerConfig.maxHeight)
                return true;
            // todo: handle horizontal scrolling
        },

        screenToTextCoordinates: function(pageX, pageY) {
            var canvasPos = this.scroller.getBoundingClientRect();

            var col = Math.round((pageX + this.scroller.scrollLeft - canvasPos.left - this.$padding - dom.getPageScrollLeft())
                / this.characterWidth);
            var row = Math.floor((pageY + this.scrollTop - canvasPos.top - dom.getPageScrollTop())
                / this.lineHeight);

            return this.session.screenToDocumentPosition(row, Math.max(col, 0));
        },

        textToScreenCoordinates: function(row, column) {
            var canvasPos = this.scroller.getBoundingClientRect();
            var pos = this.session.documentToScreenPosition(row, column);

            var x = this.$padding + Math.round(pos.column * this.characterWidth);
            var y = pos.row * this.lineHeight;

            return {
                pageX: canvasPos.left + x - this.getScrollLeft(),
                pageY: canvasPos.top + y - this.getScrollTop()
            };
        },

        visualizeFocus: function() {
            dom.addCssClass(this.container, "ace_focus");
        },

        visualizeBlur: function() {
            dom.removeCssClass(this.container, "ace_focus");
        },

        showComposition: function(position) {
            if (!this.$composition) {
                this.$composition = dom.createElement("div");
                this.$composition.className = "ace_composition";
                this.content.appendChild(this.$composition);
            }

            this.$composition.innerHTML = "&#160;";

            var pos = this.$cursorLayer.getPixelPosition();
            var style = this.$composition.style;
            style.top = pos.top + "px";
            style.left = (pos.left + this.$padding) + "px";
            style.height = this.lineHeight + "px";

            this.hideCursor();
        },

        setCompositionText: function(text) {
            dom.setInnerText(this.$composition, text);
        },

        hideComposition: function() {
            this.showCursor();

            if (!this.$composition)
                return;

            var style = this.$composition.style;
            style.top = "-10000px";
            style.left = "-10000px";
        },

        setTheme: function(theme) {
            var _self = this;

            this.$themeValue = theme;
            if (!theme || typeof theme == "string") {

                //UPDATE
                var name = (theme || 'ace/theme/Textmate').replace(/\//g, '.');
                theme = Jsx.get(name);

                if (!theme)
                    throw 'Does not include theme file' + name;
            }

            afterLoad(theme);

            function afterLoad(theme) {
                dom.importCssString(
                    theme.cssText,
                    theme.cssClass,
                    _self.container.ownerDocument
                );

                if (_self.$theme)
                    dom.removeCssClass(_self.container, _self.$theme);

                _self.$theme = theme ? theme.cssClass : null;

                if (_self.$theme)
                    dom.addCssClass(_self.container, _self.$theme);

                if (theme && theme.isDark)
                    dom.addCssClass(_self.container, "ace_dark");
                else
                    dom.removeCssClass(_self.container, "ace_dark");

                // force re-measure of the gutter width
                if (_self.$size) {
                    _self.$size.width = 0;
                    _self.onResize();
                }
            }
        },

        getTheme: function() {
            return this.$themeValue;
        },

        // Methods allows to add / remove CSS classnames to the editor element.
        // This feature can be used by plug-ins to provide a visual indication of
        // a certain mode that editor is in.

        setStyle: function setStyle(style) {
            dom.addCssClass(this.container, style);
        },

        unsetStyle: function unsetStyle(style) {
            dom.removeCssClass(this.container, style);
        },

        destroy: function() {
            this.$textLayer.destroy();
            this.$cursorLayer.destroy();
        }

    });

});
