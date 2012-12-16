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

include('ace/lib/FixOldBrowsers.js');
include('ace/lib/Event.js');
include('ace/lib/Lang.js');
include('ace/lib/UserAgent.js');
include('ace/keyboard/TextInput.js');
include('ace/mouse/MouseHandler.js');
include('ace/keyboard/KeyBinding.js');
include('ace/EditSession.js');
include('ace/Search.js');
include('ace/Range.js');
include('ace/lib/EventEmitter.js');
include('ace/commands/CommandManager.js');
include('ace/commands/DefaultCommands.js');

define(function() {

    var event = ace.lib.Event;
    var lang = ace.lib.Lang;
    var useragent = ace.lib.UserAgent;
    var TextInput = ace.keyboard.TextInput;
    var MouseHandler = ace.mouse.MouseHandler;
    //var TouchHandler = require("./touch_handler").TouchHandler;
    var KeyBinding = ace.keyboard.KeyBinding;
    var EditSession = ace.EditSession;
    var Search = ace.Search;
    var Range = ace.Range;
    var CommandManager = ace.commands.CommandManager;
    var defaultCommands = ace.commands.DefaultCommands;

    Class('ace.Editor', ace.lib.EventEmitter, {

        Editor: function(renderer, session) {

            this.$forwardEvents = {
                gutterclick: 1,
                gutterdblclick: 1
            };

            var container = renderer.getContainerElement();
            this.container = container;
            this.renderer = renderer;

            this.textInput = new TextInput(renderer.getTextAreaContainer(), this);
            this.keyBinding = new KeyBinding(this);

            // TODO detect touch event support
            if (useragent.isIPad) {
                //this.$mouseHandler = new TouchHandler(this);
            } else {
                this.$mouseHandler = new MouseHandler(this);
            }

            this.$blockScrolling = 0;
            this.$search = new Search().set({
                wrap: true
            });

            this.commands = new CommandManager(useragent.isMac ? "mac" : "win", defaultCommands.instance);
            this.setSession(session || new EditSession(""));
        },

        $originalAddEventListener: this.addEventListener,
        $originalRemoveEventListener: this.removeEventListener,

        addEventListener: function(eventName, callback) {
            if (this.$forwardEvents[eventName]) {
                return this.renderer.addEventListener(eventName, callback);
            } else {
                return this.$originalAddEventListener(eventName, callback);
            }
        },

        removeEventListener: function(eventName, callback) {
            if (this.$forwardEvents[eventName]) {
                return this.renderer.removeEventListener(eventName, callback);
            } else {
                return this.$originalRemoveEventListener(eventName, callback);
            }
        },

        setKeyboardHandler: function(keyboardHandler) {
            this.keyBinding.setKeyboardHandler(keyboardHandler);
        },

        getKeyboardHandler: function() {
            return this.keyBinding.getKeyboardHandler();
        },

        setSession: function(session) {
            if (this.session == session)
                return;

            if (this.session) {
                var oldSession = this.session;
                this.session.removeEventListener("change", this.$onDocumentChange);
                this.session.removeEventListener("changeMode", this.$onChangeMode);
                this.session.removeEventListener("tokenizerUpdate", this.$onTokenizerUpdate);
                this.session.removeEventListener("changeTabSize", this.$onChangeTabSize);
                this.session.removeEventListener("changeWrapLimit", this.$onChangeWrapLimit);
                this.session.removeEventListener("changeWrapMode", this.$onChangeWrapMode);
                this.session.removeEventListener("onChangeFold", this.$onChangeFold);
                this.session.removeEventListener("changeFrontMarker", this.$onChangeFrontMarker);
                this.session.removeEventListener("changeBackMarker", this.$onChangeBackMarker);
                this.session.removeEventListener("changeBreakpoint", this.$onChangeBreakpoint);
                this.session.removeEventListener("break", this.$onBreak);
                this.session.removeEventListener("changeAnnotation", this.$onChangeAnnotation);
                this.session.removeEventListener("changeOverwrite", this.$onCursorChange);

                var selection = this.session.getSelection();
                selection.removeEventListener("changeCursor", this.$onCursorChange);
                selection.removeEventListener("changeSelection", this.$onSelectionChange);

                this.session.setScrollTopRow(this.renderer.getScrollTopRow());
            }

            this.session = session;

            this.$onDocumentChange = this.onDocumentChange.bind(this);
            session.addEventListener("change", this.$onDocumentChange);
            this.renderer.setSession(session);

            this.$onChangeMode = this.onChangeMode.bind(this);
            session.addEventListener("changeMode", this.$onChangeMode);

            this.$onTokenizerUpdate = this.onTokenizerUpdate.bind(this);
            session.addEventListener("tokenizerUpdate", this.$onTokenizerUpdate);

            this.$onChangeTabSize = this.renderer.updateText.bind(this.renderer);
            session.addEventListener("changeTabSize", this.$onChangeTabSize);

            this.$onChangeWrapLimit = this.onChangeWrapLimit.bind(this);
            session.addEventListener("changeWrapLimit", this.$onChangeWrapLimit);

            this.$onChangeWrapMode = this.onChangeWrapMode.bind(this);
            session.addEventListener("changeWrapMode", this.$onChangeWrapMode);

            this.$onChangeFold = this.onChangeFold.bind(this);
            session.addEventListener("changeFold", this.$onChangeFold);

            this.$onChangeFrontMarker = this.onChangeFrontMarker.bind(this);
            this.session.addEventListener("changeFrontMarker", this.$onChangeFrontMarker);

            this.$onChangeBackMarker = this.onChangeBackMarker.bind(this);
            this.session.addEventListener("changeBackMarker", this.$onChangeBackMarker);

            this.$onChangeBreakpoint = this.onChangeBreakpoint.bind(this);
            this.session.addEventListener("changeBreakpoint", this.$onChangeBreakpoint);

            this.$onBreak = this.onBreak.bind(this);
            this.session.addEventListener("break", this.$onBreak);

            this.$onChangeAnnotation = this.onChangeAnnotation.bind(this);
            this.session.addEventListener("changeAnnotation", this.$onChangeAnnotation);

            this.$onCursorChange = this.onCursorChange.bind(this);
            this.session.addEventListener("changeOverwrite", this.$onCursorChange);

            this.selection = session.getSelection();
            this.selection.addEventListener("changeCursor", this.$onCursorChange);

            this.$onSelectionChange = this.onSelectionChange.bind(this);
            this.selection.addEventListener("changeSelection", this.$onSelectionChange);

            this.onChangeMode();

            this.onCursorChange();
            this.onSelectionChange();
            this.onChangeFrontMarker();
            this.onChangeBackMarker();
            this.onChangeBreakpoint();
            this.onBreak();
            this.onChangeAnnotation();
            this.session.getUseWrapMode() && this.renderer.adjustWrapLimit();
            this.renderer.scrollToRow(session.getScrollTopRow());
            this.renderer.updateFull();

            this._dispatchEvent("changeSession", {
                session: session,
                oldSession: oldSession
            });
        },

        getSession: function() {
            return this.session;
        },

        getSelection: function() {
            return this.selection;
        },

        resize: function() {
           
            this.renderer.onResize();
        },

        setTheme: function(theme) {
            this.renderer.setTheme(theme);
        },

        getTheme: function() {
            return this.renderer.getTheme();
        },

        setStyle: function(style) {
            this.renderer.setStyle(style);
        },

        unsetStyle: function(style) {
            this.renderer.unsetStyle(style);
        },

        setFontSize: function(size) {
            this.container.style.fontSize = size;
        },

        $highlightBrackets: function() {
            if (this.session.$bracketHighlight) {
                this.session.removeMarker(this.session.$bracketHighlight);
                this.session.$bracketHighlight = null;
            }

            if (this.$highlightPending) {
                return;
            }

            // perform highlight async to not block the browser during navigation
            var self = this;
            this.$highlightPending = true;
            setTimeout(function() {
                self.$highlightPending = false;

                var pos = self.session.findMatchingBracket(self.getCursorPosition());
                if (pos) {
                    var range = new Range(pos.row, pos.column, pos.row, pos.column + 1);
                    self.session.$bracketHighlight = self.session.addMarker(range, "ace_bracket", "text");
                }
            }, 10);
        },

        focus: function() {
            // Safari needs the timeout
            // iOS and Firefox need it called immediately
            // to be on the save side we do both
            var _self = this;
            setTimeout(function() {
                _self.textInput.focus();
            });
            this.textInput.focus();
        },

        isFocused: function() {
            return this.textInput.isFocused();
        },

        blur: function() {
            this.textInput.blur();
        },

        onFocus: function() {
            this.renderer.showCursor();
            this.renderer.visualizeFocus();
            this._dispatchEvent("focus");
        },

        onBlur: function() {
            this.renderer.hideCursor();
            this.renderer.visualizeBlur();
            this._dispatchEvent("blur");
        },

        onDocumentChange: function(e) {
            var delta = e.data;
            var range = delta.range;

            if (range.start.row == range.end.row && delta.action != "insertLines" && delta.action != "removeLines")
                var lastRow = range.end.row;
            else
                lastRow = Infinity;

            this.renderer.updateLines(range.start.row, lastRow);
            this._dispatchEvent("change", e);

            // update cursor because tab characters can influence the cursor position
            this.onCursorChange();
        },

        onTokenizerUpdate: function(e) {
            var rows = e.data;
            this.renderer.updateLines(rows.first, rows.last);
        },

        onCursorChange: function(e) {
            this.renderer.updateCursor();

            if (!this.$blockScrolling) {
                this.renderer.scrollCursorIntoView();
            }

            // move text input over the cursor
            // this is required for iOS and IME
            this.renderer.moveTextAreaToCursor(this.textInput.getElement());

            this.$highlightBrackets();
            this.$updateHighlightActiveLine();
        },

        $updateHighlightActiveLine: function() {
            var session = this.getSession();

            if (session.$highlightLineMarker) {
                session.removeMarker(session.$highlightLineMarker);
            }
            session.$highlightLineMarker = null;

            if (this.getHighlightActiveLine() && (this.getSelectionStyle() != "line" || !this.selection.isMultiLine())) {
                var cursor = this.getCursorPosition(),
                foldLine = this.session.getFoldLine(cursor.row);
                var range;
                if (foldLine) {
                    range = new Range(foldLine.start.row, 0, foldLine.end.row + 1, 0);
                } else {
                    range = new Range(cursor.row, 0, cursor.row + 1, 0);
                }
                session.$highlightLineMarker = session.addMarker(range, "ace_active_line", "background");
            }
        },

        onSelectionChange: function(e) {
            var session = this.getSession();

            if (session.$selectionMarker) {
                session.removeMarker(session.$selectionMarker);
            }
            session.$selectionMarker = null;

            if (!this.selection.isEmpty()) {
                var range = this.selection.getRange();
                var style = this.getSelectionStyle();
                session.$selectionMarker = session.addMarker(range, "ace_selection", style);
            } else {
                this.$updateHighlightActiveLine();
            }

            if (this.$highlightSelectedWord)
                this.session.getMode().highlightSelection(this);
        },

        onChangeFrontMarker: function() {
            this.renderer.updateFrontMarkers();
        },

        onChangeBackMarker: function() {
            this.renderer.updateBackMarkers();
        },

        onChangeBreakpoint: function() {
            this.renderer.setBreakpoints(this.session.getBreakpoints());
        },

        onBreak: function() {
            var data = this.session.getBreak();
            var row = data.row;
            if (row !== -1)
                this.gotoLine(row + 1, data.startColumn);
            this.renderer.setBreak(row);
        },

        onChangeAnnotation: function() {
            this.renderer.setAnnotations(this.session.getAnnotations());
        },

        onChangeMode: function() {
            this.renderer.updateText();
        },

        onChangeWrapLimit: function() {
            this.renderer.updateFull();
        },

        onChangeWrapMode: function() {
            this.renderer.onResize(true);
        },

        onChangeFold: function() {
            // Update the active line marker as due to folding changes the current
            // line range on the screen might have changed.
            this.$updateHighlightActiveLine();
            // TODO: this might be too much updating. Okay for now.
            this.renderer.updateFull();
        },

        getCopyText: function() {
            var text = "";
            if (!this.selection.isEmpty())
                text = this.session.getTextRange(this.getSelectionRange());

            this._emit("copy", text);
            return text;
        },

        onCut: function() {
            if (this.$readOnly)
                return;

            var range = this.getSelectionRange();
            this._emit("cut", range);

            if (!this.selection.isEmpty()) {
                this.session.remove(range);
                this.clearSelection();
            }
        },

        insert: function(text) {
            var session = this.session;
            var mode = session.getMode();

            var cursor = this.getCursorPosition();

            if (this.getBehavioursEnabled()) {
                // Get a transform if the current mode wants one.
                var transform = mode.transformAction(session.getState(cursor.row), 'insertion', this, session, text);
                if (transform)
                    text = transform.text;
            }

            text = text.replace("\t", this.session.getTabString());

            // remove selected text
            if (!this.selection.isEmpty()) {
                var cursor = this.session.remove(this.getSelectionRange());
                this.clearSelection();
            }
            else if (this.session.getOverwrite()) {
                var range = new Range.fromPoints(cursor, cursor);
                range.end.column += text.length;
                this.session.remove(range);
            }

            this.clearSelection();

            var start = cursor.column;
            var lineState = session.getState(cursor.row);
            var shouldOutdent = mode.checkOutdent(lineState, session.getLine(cursor.row), text);
            var line = session.getLine(cursor.row);
            var lineIndent = mode.getNextLineIndent(lineState, line.slice(0, cursor.column), session.getTabString());
            var end = session.insert(cursor, text);

            if (transform && transform.selection) {
                if (transform.selection.length == 2) { // Transform relative to the current column
                    this.selection.setSelectionRange(
                    new Range(cursor.row, start + transform.selection[0],
                              cursor.row, start + transform.selection[1]));
                } else { // Transform relative to the current row.
                    this.selection.setSelectionRange(
                    new Range(cursor.row + transform.selection[0],
                              transform.selection[1],
                              cursor.row + transform.selection[2],
                              transform.selection[3]));
                }
            }

            var lineState = session.getState(cursor.row);

            // TODO disabled multiline auto indent
            // possibly doing the indent before inserting the text
            // if (cursor.row !== end.row) {
            if (session.getDocument().isNewLine(text)) {
                this.moveCursorTo(cursor.row + 1, 0);

                var size = session.getTabSize();
                var minIndent = Number.MAX_VALUE;

                for (var row = cursor.row + 1; row <= end.row; ++row) {
                    var indent = 0;

                    line = session.getLine(row);
                    for (var i = 0; i < line.length; ++i)
                        if (line.charAt(i) == '\t')
                        indent += size;
                    else if (line.charAt(i) == ' ')
                        indent += 1;
                    else
                        break;
                    if (/[^\s]/.test(line))
                        minIndent = Math.min(indent, minIndent);
                }

                for (var row = cursor.row + 1; row <= end.row; ++row) {
                    var outdent = minIndent;

                    line = session.getLine(row);
                    for (var i = 0; i < line.length && outdent > 0; ++i)
                        if (line.charAt(i) == '\t')
                        outdent -= size;
                    else if (line.charAt(i) == ' ')
                        outdent -= 1;
                    session.remove(new Range(row, 0, row, i));
                }
                session.indentRows(cursor.row + 1, end.row, lineIndent);
            }
            if (shouldOutdent)
                mode.autoOutdent(lineState, session, cursor.row);
        },

        onTextInput: function(text, pasted) {
            if (pasted)
                this._emit("paste", text);

            this.keyBinding.onTextInput(text, pasted);
        },

        onCommandKey: function(e, hashId, keyCode) {
            this.keyBinding.onCommandKey(e, hashId, keyCode);
        },

        setOverwrite: function(overwrite) {
            this.session.setOverwrite(overwrite);
        },

        getOverwrite: function() {
            return this.session.getOverwrite();
        },

        toggleOverwrite: function() {
            this.session.toggleOverwrite();
        },

        setScrollSpeed: function(speed) {
            this.$mouseHandler.setScrollSpeed(speed);
        },

        getScrollSpeed: function() {
            return this.$mouseHandler.getScrollSpeed()
        },

        $selectionStyle: "line",
        setSelectionStyle: function(style) {
            if (this.$selectionStyle == style) return;

            this.$selectionStyle = style;
            this.onSelectionChange();
            this._dispatchEvent("changeSelectionStyle", { data: style });
        },

        getSelectionStyle: function() {
            return this.$selectionStyle;
        },

        $highlightActiveLine: true,
        setHighlightActiveLine: function(shouldHighlight) {
            if (this.$highlightActiveLine == shouldHighlight) return;

            this.$highlightActiveLine = shouldHighlight;
            this.$updateHighlightActiveLine();
        },

        getHighlightActiveLine: function() {
            return this.$highlightActiveLine;
        },

        $highlightSelectedWord: true,
        setHighlightSelectedWord: function(shouldHighlight) {
            if (this.$highlightSelectedWord == shouldHighlight)
                return;

            this.$highlightSelectedWord = shouldHighlight;
            if (shouldHighlight)
                this.session.getMode().highlightSelection(this);
            else
                this.session.getMode().clearSelectionHighlight(this);
        },

        getHighlightSelectedWord: function() {
            return this.$highlightSelectedWord;
        },

        setShowInvisibles: function(showInvisibles) {
            if (this.getShowInvisibles() == showInvisibles)
                return;

            this.renderer.setShowInvisibles(showInvisibles);
        },

        getShowInvisibles: function() {
            return this.renderer.getShowInvisibles();
        },

        setShowPrintMargin: function(showPrintMargin) {
            this.renderer.setShowPrintMargin(showPrintMargin);
        },

        getShowPrintMargin: function() {
            return this.renderer.getShowPrintMargin();
        },

        setPrintMarginColumn: function(showPrintMargin) {
            this.renderer.setPrintMarginColumn(showPrintMargin);
        },

        getPrintMarginColumn: function() {
            return this.renderer.getPrintMarginColumn();
        },

        $readOnly: false,

        setReadOnly: function(readOnly) {
            this.$readOnly = readOnly;
        },

        getReadOnly: function() {
            return this.$readOnly;
        },

        $modeBehaviours: true,

        setBehavioursEnabled: function(enabled) {
            this.$modeBehaviours = enabled;
        },

        getBehavioursEnabled: function() {
            return this.$modeBehaviours;
        },

        setShowFoldWidgets: function(show) {
            var gutter = this.renderer.$gutterLayer;
            if (gutter.getShowFoldWidgets() == show)
                return;

            this.renderer.$gutterLayer.setShowFoldWidgets(show);
            this.$showFoldWidgets = show;
            this.renderer.updateFull();
        },

        getShowFoldWidgets: function() {
            return this.renderer.$gutterLayer.getShowFoldWidgets();
        },

        remove: function(dir) {
            if (this.selection.isEmpty()) {
                if (dir == "left")
                    this.selection.selectLeft();
                else
                    this.selection.selectRight();
            }

            var range = this.getSelectionRange();
            if (this.getBehavioursEnabled()) {
                var session = this.session;
                var state = session.getState(range.start.row);
                var new_range = session.getMode().transformAction(state, 'deletion', this, session, range);
                if (new_range)
                    range = new_range;
            }

            this.session.remove(range);
            this.clearSelection();
        },

        removeWordRight: function() {
            if (this.selection.isEmpty())
                this.selection.selectWordRight();

            this.session.remove(this.getSelectionRange());
            this.clearSelection();
        },

        removeWordLeft: function() {
            if (this.selection.isEmpty())
                this.selection.selectWordLeft();

            this.session.remove(this.getSelectionRange());
            this.clearSelection();
        },

        removeToLineStart: function() {
            if (this.selection.isEmpty())
                this.selection.selectLineStart();

            this.session.remove(this.getSelectionRange());
            this.clearSelection();
        },

        removeToLineEnd: function() {
            if (this.selection.isEmpty())
                this.selection.selectLineEnd();

            var range = this.getSelectionRange();
            if (range.start.column == range.end.column && range.start.row == range.end.row) {
                range.end.column = 0;
                range.end.row++;
            }

            this.session.remove(range);
            this.clearSelection();
        },

        splitLine: function() {
            if (!this.selection.isEmpty()) {
                this.session.remove(this.getSelectionRange());
                this.clearSelection();
            }

            var cursor = this.getCursorPosition();
            this.insert("\n");
            this.moveCursorToPosition(cursor);
        },

        transposeLetters: function() {
            if (!this.selection.isEmpty()) {
                return;
            }

            var cursor = this.getCursorPosition();
            var column = cursor.column;
            if (column === 0)
                return;

            var line = this.session.getLine(cursor.row);
            var swap, range;
            if (column < line.length) {
                swap = line.charAt(column) + line.charAt(column - 1);
                range = new Range(cursor.row, column - 1, cursor.row, column + 1);
            }
            else {
                swap = line.charAt(column - 1) + line.charAt(column - 2);
                range = new Range(cursor.row, column - 2, cursor.row, column);
            }
            this.session.replace(range, swap);
        },

        toLowerCase: function() {
            var originalRange = this.getSelectionRange();
            if (this.selection.isEmpty()) {
                this.selection.selectWord();
            }

            var range = this.getSelectionRange();
            var text = this.session.getTextRange(range);
            this.session.replace(range, text.toLowerCase());
            this.selection.setSelectionRange(originalRange);
        },

        toUpperCase: function() {
            var originalRange = this.getSelectionRange();
            if (this.selection.isEmpty()) {
                this.selection.selectWord();
            }

            var range = this.getSelectionRange();
            var text = this.session.getTextRange(range);
            this.session.replace(range, text.toUpperCase());
            this.selection.setSelectionRange(originalRange);
        },

        indent: function() {
            var session = this.session;
            var range = this.getSelectionRange();

            if (range.start.row < range.end.row || range.start.column < range.end.column) {
                var rows = this.$getSelectedRows();
                session.indentRows(rows.first, rows.last, "\t");
            } else {
                var indentString;

                if (this.session.getUseSoftTabs()) {
                    var size = session.getTabSize(),
                    position = this.getCursorPosition(),
                    column = session.documentToScreenColumn(position.row, position.column),
                    count = (size - column % size);

                    indentString = lang.stringRepeat(" ", count);
                } else
                    indentString = "\t";
                return this.insert(indentString);
            }
        },

        blockOutdent: function() {
            var selection = this.session.getSelection();
            this.session.outdentRows(selection.getRange());
        },

        toggleCommentLines: function() {
            var state = this.session.getState(this.getCursorPosition().row);
            var rows = this.$getSelectedRows();
            this.session.getMode().toggleCommentLines(state, this.session, rows.first, rows.last);
        },

        removeLines: function() {
            var rows = this.$getSelectedRows();
            var range;
            if (rows.first == 0 || rows.last + 1 < this.session.getLength())
                range = new Range(rows.first, 0, rows.last + 1, 0);
            else
                range = new Range(
                rows.first - 1, this.session.getLine(rows.first - 1).length,
                rows.last, this.session.getLine(rows.last).length
            );
            this.session.remove(range);
            this.clearSelection();
        },

        moveLinesDown: function() {
            this.$moveLines(function(firstRow, lastRow) {
                return this.session.moveLinesDown(firstRow, lastRow);
            });
        },

        moveLinesUp: function() {
            this.$moveLines(function(firstRow, lastRow) {
                return this.session.moveLinesUp(firstRow, lastRow);
            });
        },

        moveText: function(range, toPosition) {
            if (this.$readOnly)
                return null;

            return this.session.moveText(range, toPosition);
        },

        copyLinesUp: function() {
            this.$moveLines(function(firstRow, lastRow) {
                this.session.duplicateLines(firstRow, lastRow);
                return 0;
            });
        },

        copyLinesDown: function() {
            this.$moveLines(function(firstRow, lastRow) {
                return this.session.duplicateLines(firstRow, lastRow);
            });
        },

        $moveLines: function(mover) {
            var rows = this.$getSelectedRows();
            var selection = this.selection;
            if (!selection.isMultiLine()) {
                var range = selection.getRange();
                var reverse = selection.isBackwards();
            }

            var linesMoved = mover.call(this, rows.first, rows.last);

            if (range) {
                range.start.row += linesMoved;
                range.end.row += linesMoved;
                selection.setSelectionRange(range, reverse);
            } else {
                selection.setSelectionAnchor(rows.last + linesMoved + 1, 0);
                selection.$moveSelection(function() {
                    selection.moveCursorTo(rows.first + linesMoved, 0);
                });
            }
        },

        $getSelectedRows: function() {
            var range = this.getSelectionRange().collapseRows();

            return {
                first: range.start.row,
                last: range.end.row
            };
        },

        onCompositionStart: function(text) {
            this.renderer.showComposition(this.getCursorPosition());
        },

        onCompositionUpdate: function(text) {
            this.renderer.setCompositionText(text);
        },

        onCompositionEnd: function() {
            this.renderer.hideComposition();
        },

        getFirstVisibleRow: function() {
            return this.renderer.getFirstVisibleRow();
        },

        getLastVisibleRow: function() {
            return this.renderer.getLastVisibleRow();
        },

        isRowVisible: function(row) {
            return (row >= this.getFirstVisibleRow() && row <= this.getLastVisibleRow());
        },

        isRowFullyVisible: function(row) {
            return (row >= this.renderer.getFirstFullyVisibleRow() && row <= this.renderer.getLastFullyVisibleRow());
        },

        $getVisibleRowCount: function() {
            return this.renderer.getScrollBottomRow() - this.renderer.getScrollTopRow() + 1;
        },

        $getPageDownRow: function() {
            return this.renderer.getScrollBottomRow();
        },

        $getPageUpRow: function() {
            var firstRow = this.renderer.getScrollTopRow();
            var lastRow = this.renderer.getScrollBottomRow();

            return firstRow - (lastRow - firstRow);
        },

        selectPageDown: function() {
            var row = this.$getPageDownRow() + Math.floor(this.$getVisibleRowCount() / 2);

            this.scrollPageDown();

            var selection = this.getSelection();
            var leadScreenPos = this.session.documentToScreenPosition(selection.getSelectionLead());
            var dest = this.session.screenToDocumentPosition(row, leadScreenPos.column);
            selection.selectTo(dest.row, dest.column);
        },

        selectPageUp: function() {
            var visibleRows = this.renderer.getScrollTopRow() - this.renderer.getScrollBottomRow();
            var row = this.$getPageUpRow() + Math.round(visibleRows / 2);

            this.scrollPageUp();

            var selection = this.getSelection();
            var leadScreenPos = this.session.documentToScreenPosition(selection.getSelectionLead());
            var dest = this.session.screenToDocumentPosition(row, leadScreenPos.column);
            selection.selectTo(dest.row, dest.column);
        },

        gotoPageDown: function() {
            var row = this.$getPageDownRow();
            var column = this.getCursorPositionScreen().column;

            this.scrollToRow(row);
            this.getSelection().moveCursorToScreen(row, column);
        },

        gotoPageUp: function() {
            var row = this.$getPageUpRow();
            var column = this.getCursorPositionScreen().column;

            this.scrollToRow(row);
            this.getSelection().moveCursorToScreen(row, column);
        },

        scrollPageDown: function() {
            this.scrollToRow(this.$getPageDownRow());
        },

        scrollPageUp: function() {
            this.renderer.scrollToRow(this.$getPageUpRow());
        },

        scrollToRow: function(row) {
            this.renderer.scrollToRow(row);
        },

        scrollToLine: function(line, center) {
            this.renderer.scrollToLine(line, center);
        },

        centerSelection: function() {
            var range = this.getSelectionRange();
            var line = Math.floor(range.start.row + (range.end.row - range.start.row) / 2);
            this.renderer.scrollToLine(line, true);
        },

        getCursorPosition: function() {
            return this.selection.getCursor();
        },

        getCursorPositionScreen: function() {
            return this.session.documentToScreenPosition(this.getCursorPosition());
        },

        getSelectionRange: function() {
            return this.selection.getRange();
        },

        selectAll: function() {
            this.$blockScrolling += 1;
            this.selection.selectAll();
            this.$blockScrolling -= 1;
        },

        clearSelection: function() {
            this.selection.clearSelection();
        },

        moveCursorTo: function(row, column) {
            this.selection.moveCursorTo(row, column);
        },

        moveCursorToPosition: function(pos) {
            this.selection.moveCursorToPosition(pos);
        },

        gotoLine: function(lineNumber, column) {
            this.selection.clearSelection();
            this.session.unfold({ row: lineNumber - 1, column: column || 0 })

            this.$blockScrolling += 1;
            this.moveCursorTo(lineNumber - 1, column || 0);
            this.$blockScrolling -= 1;
            if (!this.isRowFullyVisible(this.getCursorPosition().row))
                this.scrollToLine(lineNumber, true);
        },

        navigateTo: function(row, column) {
            this.clearSelection();
            this.moveCursorTo(row, column);
        },

        navigateUp: function(times) {
            this.selection.clearSelection();
            times = times || 1;
            this.selection.moveCursorBy(-times, 0);
        },

        navigateDown: function(times) {
            this.selection.clearSelection();
            times = times || 1;
            this.selection.moveCursorBy(times, 0);
        },

        navigateLeft: function(times) {
            if (!this.selection.isEmpty()) {
                var selectionStart = this.getSelectionRange().start;
                this.moveCursorToPosition(selectionStart);
            }
            else {
                times = times || 1;
                while (times--) {
                    this.selection.moveCursorLeft();
                }
            }
            this.clearSelection();
        },

        navigateRight: function(times) {
            if (!this.selection.isEmpty()) {
                var selectionEnd = this.getSelectionRange().end;
                this.moveCursorToPosition(selectionEnd);
            }
            else {
                times = times || 1;
                while (times--) {
                    this.selection.moveCursorRight();
                }
            }
            this.clearSelection();
        },

        navigateLineStart: function() {
            this.selection.moveCursorLineStart();
            this.clearSelection();
        },

        navigateLineEnd: function() {
            this.selection.moveCursorLineEnd();
            this.clearSelection();
        },

        navigateFileEnd: function() {
            this.selection.moveCursorFileEnd();
            this.clearSelection();
        },

        navigateFileStart: function() {
            this.selection.moveCursorFileStart();
            this.clearSelection();
        },

        navigateWordRight: function() {
            this.selection.moveCursorWordRight();
            this.clearSelection();
        },

        navigateWordLeft: function() {
            this.selection.moveCursorWordLeft();
            this.clearSelection();
        },

        replace: function(replacement, options) {
            if (options)
                this.$search.set(options);

            var range = this.$search.find(this.session);
            if (!range)
                return;

            this.$tryReplace(range, replacement);
            if (range !== null)
                this.selection.setSelectionRange(range);
        },

        replaceAll: function(replacement, options) {
            if (options) {
                this.$search.set(options);
            }

            var ranges = this.$search.findAll(this.session);
            if (!ranges.length)
                return;

            var selection = this.getSelectionRange();
            this.clearSelection();
            this.selection.moveCursorTo(0, 0);

            this.$blockScrolling += 1;
            for (var i = ranges.length - 1; i >= 0; --i)
                this.$tryReplace(ranges[i], replacement);

            this.selection.setSelectionRange(selection);
            this.$blockScrolling -= 1;
        },

        $tryReplace: function(range, replacement) {
            var input = this.session.getTextRange(range);
            replacement = this.$search.replace(input, replacement);
            if (replacement !== null) {
                range.end = this.session.replace(range, replacement);
                return range;
            } else {
                return null;
            }
        },

        getLastSearchOptions: function() {
            return this.$search.getOptions();
        },

        find: function(needle, options) {
            this.clearSelection();
            options = options || {};
            options.needle = needle;
            this.$search.set(options);
            this.$find();
        },

        findNext: function(options) {
            options = options || {};
            if (typeof options.backwards == "undefined")
                options.backwards = false;
            this.$search.set(options);
            this.$find();
        },

        findPrevious: function(options) {
            options = options || {};
            if (typeof options.backwards == "undefined")
                options.backwards = true;
            this.$search.set(options);
            this.$find();
        },

        $find: function(backwards) {
            if (!this.selection.isEmpty())
                this.$search.set({ needle: this.session.getTextRange(this.getSelectionRange()) });

            if (typeof backwards != "undefined")
                this.$search.set({ backwards: backwards });

            var range = this.$search.find(this.session);
            if (range) {
                this.session.unfold(range);
                this.gotoLine(range.end.row + 1, range.end.column);
                this.selection.setSelectionRange(range);
            }
        },

        undo: function() {
            this.session.getUndoManager().undo();
        },

        redo: function() {
            this.session.getUndoManager().redo();
        },

        destroy: function() {
            this.renderer.destroy();
        }

    });

});