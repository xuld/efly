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
*      Mihai Sucan <mihai DOT sucan AT gmail DOT com>
*      Julian Viereck <julian DOT viereck AT gmail DOT com>
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

include('ace/lib/Lang.js');
include('ace/lib/EventEmitter.js');
include('ace/Selection.js');
include('ace/mode/Text.js');
include('ace/Range.js');
include('ace/Document.js');
include('ace/BackgroundTokenizer.js');
include('ace/edit_session/FoldLine.js');
include('ace/edit_session/Fold.js');
include('ace/TokenIterator.js');
include('Jsx/Thread.js');

define(function() {

    var lang = ace.lib.Lang;
    var Selection = ace.Selection;
    var TextMode = ace.mode.Text;
    var Range = ace.Range;
    var Document = ace.Document;
    var BackgroundTokenizer = ace.BackgroundTokenizer;

    var FoldLine = ace.edit_session.FoldLine;
    var Fold = ace.edit_session.Fold;
    var TokenIterator = ace.TokenIterator;

    // "Tokens"
    var CHAR = 1,
        CHAR_EXT = 2,
        PLACEHOLDER_START = 3,
        PLACEHOLDER_BODY = 4,
        PUNCTUATION = 9,
        SPACE = 10,
        TAB = 11,
        TAB_SPACE = 12;

    // For every keystroke this gets called once per char in the whole doc!!
    // Wouldn't hurt to make it a bit faster for c >= 0x1100
    function isFullWidth(c) {
        if (c < 0x1100)
            return false;
        return c >= 0x1100 && c <= 0x115F ||
               c >= 0x11A3 && c <= 0x11A7 ||
               c >= 0x11FA && c <= 0x11FF ||
               c >= 0x2329 && c <= 0x232A ||
               c >= 0x2E80 && c <= 0x2E99 ||
               c >= 0x2E9B && c <= 0x2EF3 ||
               c >= 0x2F00 && c <= 0x2FD5 ||
               c >= 0x2FF0 && c <= 0x2FFB ||
               c >= 0x3000 && c <= 0x303E ||
               c >= 0x3041 && c <= 0x3096 ||
               c >= 0x3099 && c <= 0x30FF ||
               c >= 0x3105 && c <= 0x312D ||
               c >= 0x3131 && c <= 0x318E ||
               c >= 0x3190 && c <= 0x31BA ||
               c >= 0x31C0 && c <= 0x31E3 ||
               c >= 0x31F0 && c <= 0x321E ||
               c >= 0x3220 && c <= 0x3247 ||
               c >= 0x3250 && c <= 0x32FE ||
               c >= 0x3300 && c <= 0x4DBF ||
               c >= 0x4E00 && c <= 0xA48C ||
               c >= 0xA490 && c <= 0xA4C6 ||
               c >= 0xA960 && c <= 0xA97C ||
               c >= 0xAC00 && c <= 0xD7A3 ||
               c >= 0xD7B0 && c <= 0xD7C6 ||
               c >= 0xD7CB && c <= 0xD7FB ||
               c >= 0xF900 && c <= 0xFAFF ||
               c >= 0xFE10 && c <= 0xFE19 ||
               c >= 0xFE30 && c <= 0xFE52 ||
               c >= 0xFE54 && c <= 0xFE66 ||
               c >= 0xFE68 && c <= 0xFE6B ||
               c >= 0xFF01 && c <= 0xFF60 ||
               c >= 0xFFE0 && c <= 0xFFE6;
    };

    function _getValue() {
        return this.doc.getValue();
    }

    var EditSession =

    Class('ace.EditSession', ace.lib.EventEmitter, {

        EditSession: function(text, mode) {

            this.$defaultUndoManager = {
                undo: function() { },
                redo: function() { },
                reset: function() { }
            };

            this.$wrapLimitRange = {
                min: null,
                max: null
            };

            this.$brackets = {
                ")": "(",
                "(": ")",
                "]": "[",
                "[": "]",
                "{": "}",
                "}": "{"
            };

            this.$break = {
                row: -1,
                startColumn: -1,
                endColumn: -1
            };
            this.$modified = true;
            this.$breakpoints = [];
            this.$frontMarkers = {};
            this.$backMarkers = {};
            this.$markerId = 1;
            this.$rowCache = [];
            this.$wrapData = [];
            this.$foldData = [];
            this.$foldData.toString = function() {
                var str = "";
                this.forEach(function(foldLine) {
                    str += "\n" + foldLine.toString();
                });
                return str;
            }

            if (text instanceof Document) {
                this.setDocument(text);
            } else {
                this.setDocument(new Document(text));
            }

            this.selection = new Selection(this);
            if (mode)
                this.setMode(mode);
            else
                this.setMode(new TextMode());
        },

        setDocument: function(doc) {
            if (this.doc)
                throw new Error("Document is already set");

            this.doc = doc;
            doc.on("change", this.onChange.bind(this));
            this.on("changeFold", this.onChangeFold.bind(this));

            if (this.bgTokenizer) {
                this.bgTokenizer.setDocument(this.getDocument());
                this.bgTokenizer.start(0);
            }
        },

        getDocument: function() {
            return this.doc;
        },

        $resetRowCache: function(row) {
            if (row == 0) {
                this.$rowCache = [];
                return;
            }
            var rowCache = this.$rowCache;
            for (var i = 0; i < rowCache.length; i++) {
                if (rowCache[i].docRow >= row) {
                    rowCache.splice(i, rowCache.length);
                    return;
                }
            }
        },

        onChangeFold: function(e) {
            var fold = e.data;
            this.$resetRowCache(fold.start.row);
        },

        onChange: function(e) {
            var delta = e.data;
            this.$modified = true;

            this.$resetRowCache(delta.range.start.row);

            var removedFolds = this.$updateInternalDataOnChange(e);
            if (!this.$fromUndo && this.$undoManager && !delta.ignore) {
                this.$deltasDoc.push(delta);
                if (removedFolds && removedFolds.length != 0) {
                    this.$deltasFold.push({
                        action: "removeFolds",
                        folds: removedFolds
                    });
                }

                this.$informUndoManager.schedule();
            }

            this.bgTokenizer.start(delta.range.start.row);

            var breakpoints = this.$breakpoints;
            var len = breakpoints.length;
            var action = delta.action;
            var range = delta.range;
            var start = range.start.row;
            var end = range.end.row;
            switch (action) {
                case 'removeText':
                    breakpoints.splice(start + 1, end - start);
                    break;
                case 'removeLines':
                    breakpoints.splice(start + 1, end - start);
                    break;
                case 'insertText':
                    if (start + 1 < len && end - start > 0)
                        breakpoints.splice.apply(breakpoints, [start + 1, 0].concat(new Array(end - start)));
                    break;
                case 'insertLines':
                    if (start + 1 < len)
                        breakpoints.splice.apply(breakpoints, [start + 1, 0].concat(new Array(end - start)));
                    break;
            }

            this._dispatchEvent("change", e);
        },

        setValue: function(text) {
            this.doc.setValue(text);
            this.selection.moveCursorTo(0, 0);
            this.selection.clearSelection();

            this.$resetRowCache(0);
            this.$deltas = [];
            this.$deltasDoc = [];
            this.$deltasFold = [];
            this.getUndoManager().reset();
        },

        getValue: _getValue,
        toString: _getValue,

        getSelection: function() {
            return this.selection;
        },

        getState: function(row) {
            return this.bgTokenizer.getState(row);
        },

        getTokens: function(firstRow, lastRow) {
            return this.bgTokenizer.getTokens(firstRow, lastRow);
        },

        getTokenAt: function(row, column) {
            var tokens = this.bgTokenizer.getTokens(row, row)[0].tokens;
            var token, c = 0;
            if (column == null) {
                i = tokens.length - 1;
                c = this.getLine(row).length;
            } else {
                for (var i = 0; i < tokens.length; i++) {
                    c += tokens[i].value.length;
                    if (c >= column)
                        break;
                }
            }
            token = tokens[i];
            if (!token)
                return null;
            token.index = i;
            token.start = c - token.value.length;
            return token;
        },

        setUndoManager: function(undoManager) {
            this.$undoManager = undoManager;
            this.$resetRowCache(0);
            this.$deltas = [];
            this.$deltasDoc = [];
            this.$deltasFold = [];

            if (this.$informUndoManager)
                this.$informUndoManager.cancel();

            if (undoManager) {
                var self = this;
                this.$syncInformUndoManager = function() {
                    self.$informUndoManager.cancel();

                    if (self.$deltasFold.length) {
                        self.$deltas.push({
                            group: "fold",
                            deltas: self.$deltasFold
                        });
                        self.$deltasFold = [];
                    }

                    if (self.$deltasDoc.length) {
                        self.$deltas.push({
                            group: "doc",
                            deltas: self.$deltasDoc
                        });
                        self.$deltasDoc = [];
                    }

                    if (self.$deltas.length > 0) {
                        undoManager.execute({
                            action: "aceupdate",
                            args: [self.$deltas, self]
                        });
                    }

                    self.$deltas = [];
                }
                this.$informUndoManager =
                lang.deferredCall(this.$syncInformUndoManager);
            }
        },

        getUndoManager: function() {
            return this.$undoManager || this.$defaultUndoManager;
        },

        getTabString: function() {
            if (this.getUseSoftTabs()) {
                return lang.stringRepeat(" ", this.getTabSize());
            } else {
                return "\t";
            }
        },

        $useSoftTabs: true,
        setUseSoftTabs: function(useSoftTabs) {
            if (this.$useSoftTabs === useSoftTabs) return;

            this.$useSoftTabs = useSoftTabs;
        },

        getUseSoftTabs: function() {
            return this.$useSoftTabs;
        },

        $tabSize: 4,
        setTabSize: function(tabSize) {
            if (isNaN(tabSize) || this.$tabSize === tabSize) return;

            this.$modified = true;
            this.$tabSize = tabSize;
            this._dispatchEvent("changeTabSize");
        },

        getTabSize: function() {
            return this.$tabSize;
        },

        isTabStop: function(position) {
            return this.$useSoftTabs && (position.column % this.$tabSize == 0);
        },

        $overwrite: false,
        setOverwrite: function(overwrite) {
            if (this.$overwrite == overwrite) return;

            this.$overwrite = overwrite;
            this._dispatchEvent("changeOverwrite");
        },

        getOverwrite: function() {
            return this.$overwrite;
        },

        toggleOverwrite: function() {
            this.setOverwrite(!this.$overwrite);
        },

        getBreakpoints: function() {
            return this.$breakpoints;
        },

        setBreakpoints: function(rows) {
            this.$breakpoints = [];
            for (var i = 0; i < rows.length; i++) {
                this.$breakpoints[rows[i]] = true;
            }
            this._dispatchEvent("changeBreakpoint", { action: 'setAll' });
        },

        clearBreakpoints: function() {
            this.$breakpoints = [];
            this._dispatchEvent("changeBreakpoint", { action: 'clearAll' });
        },

        setBreakpoint: function(row) {
            this.$breakpoints[row] = true;
            this._dispatchEvent("changeBreakpoint", { action: 'set', row: row });
        },

        clearBreakpoint: function(row) {
            delete this.$breakpoints[row];
            this._dispatchEvent("changeBreakpoint", { action: 'clear', row: row });
        },

        getBreakpoints: function() {
            return this.$breakpoints;
        },

        setBreak: function(row, startColumn, endColumn) {
            this.clearBreak();
            this.$break = {
                row: row,
                startColumn: startColumn,
                endColumn: endColumn
            };
            var range = new Range(row, startColumn, row, endColumn);

            this.$breakMarkerId = this.addMarker(range, 'ace_break', 'text');
            this._dispatchEvent("break", {
                action: 'set',
                row: row,
                startColumn: startColumn,
                endColumn: endColumn
            });
        },

        clearBreak: function() {
            var breakMarkerId = this.$breakMarkerId;
            if (!breakMarkerId)
                return;

            this.removeMarker(breakMarkerId);
            this.$break = { row: -1, startColumn: -1, endColumn: -1 };
            this.$breakMarkerId = 0;
            this._dispatchEvent("break", { action: 'clear' });
        },

        getBreak: function() {
            return this.$break;
        },

        addMarker: function(range, clazz, type, inFront) {
            var id = this.$markerId++;

            var marker = {
                range: range,
                type: type || "line",
                renderer: typeof type == "function" ? type : null,
                clazz: clazz,
                inFront: !!inFront
            }

            if (inFront) {
                this.$frontMarkers[id] = marker;
                this._dispatchEvent("changeFrontMarker")
            } else {
                this.$backMarkers[id] = marker;
                this._dispatchEvent("changeBackMarker")
            }

            return id;
        },

        removeMarker: function(markerId) {
            var marker = this.$frontMarkers[markerId] || this.$backMarkers[markerId];
            if (!marker)
                return;

            var markers = marker.inFront ? this.$frontMarkers : this.$backMarkers;
            if (marker) {
                delete (markers[markerId]);
                this._dispatchEvent(marker.inFront ? "changeFrontMarker" : "changeBackMarker");
            }
        },

        getMarkers: function(inFront) {
            return inFront ? this.$frontMarkers : this.$backMarkers;
        },

        /**
        * Error:
        *  {
        *    row: 12,
        *    column: 2, //can be undefined
        *    text: "Missing argument",
        *    type: "error" // or "warning" or "info"
        *  }
        */
        setAnnotations: function(annotations) {
            this.$annotations = {};
            for (var i = 0; i < annotations.length; i++) {
                var annotation = annotations[i];
                var row = annotation.row;
                if (this.$annotations[row])
                    this.$annotations[row].push(annotation);
                else
                    this.$annotations[row] = [annotation];
            }
            this._dispatchEvent("changeAnnotation", {});
        },

        getAnnotations: function() {
            return this.$annotations || {};
        },

        clearAnnotations: function() {
            this.$annotations = {};
            this._dispatchEvent("changeAnnotation", {});
        },

        $detectNewLine: function(text) {
            var match = text.match(/^.*?(\r?\n)/m);
            if (match) {
                this.$autoNewLine = match[1];
            } else {
                this.$autoNewLine = "\n";
            }
        },

        getWordRange: function(row, column) {

            var line = this.getLine(row);

            var inToken = false;
            if (column > 0) {
                inToken = !!line.charAt(column - 1).match(this.tokenRe);
            }

            if (!inToken) {
                inToken = !!line.charAt(column).match(this.tokenRe);
            }

            var re = inToken ? this.tokenRe : this.nonTokenRe;

            var start = column;
            if (start > 0) {
                do {
                    start--;
                }
                while (start >= 0 && line.charAt(start).match(re));
                start++;
            }

            var end = column;
            while (end < line.length && line.charAt(end).match(re)) {
                end++;
            }

            return new Range(row, start, row, end);
        },

        // Gets the range of a word including its right whitespace
        getAWordRange: function(row, column) {
            var wordRange = this.getWordRange(row, column);
            var line = this.getLine(wordRange.end.row);

            while (line.charAt(wordRange.end.column).match(/[ \t]/)) {
                wordRange.end.column += 1;
            }
            return wordRange;
        },

        setNewLineMode: function(newLineMode) {
            this.doc.setNewLineMode(newLineMode);
        },

        getNewLineMode: function() {
            return this.doc.getNewLineMode();
        },

        $useWorker: true,
        setUseWorker: function(useWorker) {
            if (this.$useWorker == useWorker)
                return;

            this.$useWorker = useWorker;

            this.$stopWorker();
            if (useWorker)
                this.$startWorker();
        },

        getUseWorker: function() {
            return this.$useWorker;
        },

        onReloadTokenizer: function(e) {
            var rows = e.data;
            this.bgTokenizer.start(rows.first);
            this._dispatchEvent("tokenizerUpdate", e);
        },
        
        destroy: function(){
            //TODO ?
            this.$stopWorker();
        },

        $mode: null,
        setMode: function(mode) {
            if (this.$mode === mode) return;
            this.$mode = mode;

            this.$stopWorker();

            if (this.$useWorker)
                this.$startWorker();

            var tokenizer = mode.getTokenizer();

            if (tokenizer.addEventListener !== undefined) {
                var onReloadTokenizer = this.onReloadTokenizer.bind(this);
                tokenizer.addEventListener("update", onReloadTokenizer);
            }

            if (!this.bgTokenizer) {
                this.bgTokenizer = new BackgroundTokenizer(tokenizer);
                var _self = this;
                this.bgTokenizer.addEventListener("update", function(e) {
                    _self._dispatchEvent("tokenizerUpdate", e);
                });
            } else {
                this.bgTokenizer.setTokenizer(tokenizer);
            }

            this.bgTokenizer.setDocument(this.getDocument());
            this.bgTokenizer.start(0);

            //UPDATE
            this.tokenRe = mode.tokenRe;
            this.nonTokenRe = mode.nonTokenRe;

            if (mode.foldingRules)
                this.$setFolding(mode.foldingRules);

            this._dispatchEvent("changeMode");
        },

        $stopWorker: function() {

            if (this.$worker) {
                //UPDATE
                this.$worker.close();
            }

            this.$worker = null;
        },

        $startWorker: function() {
            //UPDATE
            if (Jsx.Thread.isThread) {
                try {
                    this.$worker = this.$mode.createWorker(this);
                } catch (e) {
                    console.log("Could not load worker");
                    console.log(e);
                    this.$worker = null;
                }
            }
            else
                this.$worker = null;
        },

        getMode: function() {
            return this.$mode;
        },

        $scrollTop: 0,
        setScrollTopRow: function(scrollTopRow) {
            if (this.$scrollTop === scrollTopRow) return;

            this.$scrollTop = scrollTopRow;
            this._dispatchEvent("changeScrollTop");
        },

        getScrollTopRow: function() {
            return this.$scrollTop;
        },

        getWidth: function() {
            this.$computeWidth();
            return this.width;
        },

        getScreenWidth: function() {
            this.$computeWidth();
            return this.screenWidth;
        },

        $computeWidth: function(force) {

            if (this.$modified || force) {
                this.$modified = false;

                var lines = this.doc.getAllLines();
                var longestLine = 0;
                var longestScreenLine = 0;
                var maxLine;

                for (var i = 0; i < lines.length; i++) {
                    var foldLine = this.getFoldLine(i),
                    line, len;

                    line = lines[i];
                    if (foldLine) {
                        var end = foldLine.range.end;
                        line = this.getFoldDisplayLine(foldLine);
                        // Continue after the foldLine.end.row. All the lines in
                        // between are folded.
                        i = end.row;
                    }
                    len = line.length;

                    //UPDATE
                    if (longestLine < len) {
                        maxLine = line;
                        longestLine = len;
                    }

                    /*
                    longestLine = Math.max(longestLine, len);
                    
                    //$getStringScreenWidth 该函数太占用性能
                    
                    if (!this.$useWrapMode) {

                        longestScreenLine = Math.max(
                    longestScreenLine,
                    //line.length * 2
                    this.$getStringScreenWidth(line)[0]
                    );

                    }*/

                }
                this.width = longestLine;

                if (this.$useWrapMode) {
                    this.screenWidth = this.$wrapLimit;
                } else {

                    //UPDATE

                    if (maxLine) {

                        this.screenWidth = this.$getStringScreenWidth(maxLine)[0];
                    }

                    else {

                        this.screenWidth = 0;
                    }
                    //this.screenWidth = longestScreenLine;

                }
            }
        },

        /**
        * Get a verbatim copy of the given line as it is in the document
        */
        getLine: function(row) {
            return this.doc.getLine(row);
        },

        getLines: function(firstRow, lastRow) {
            return this.doc.getLines(firstRow, lastRow);
        },

        getLength: function() {
            return this.doc.getLength();
        },

        getTextRange: function(range) {
            return this.doc.getTextRange(range);
        },

        insert: function(position, text) {
            return this.doc.insert(position, text);
        },

        remove: function(range) {
            return this.doc.remove(range);
        },

        undoChanges: function(deltas, dontSelect) {
            if (!deltas.length)
                return;

            this.$fromUndo = true;
            var lastUndoRange = null;
            for (var i = deltas.length - 1; i != -1; i--) {
                delta = deltas[i];
                if (delta.group == "doc") {
                    this.doc.revertDeltas(delta.deltas);
                    lastUndoRange =
                    this.$getUndoSelection(delta.deltas, true, lastUndoRange);
                } else {
                    delta.deltas.forEach(function(foldDelta) {
                        this.addFolds(foldDelta.folds);
                    }, this);
                }
            }
            this.$fromUndo = false;
            lastUndoRange &&
            !dontSelect &&
            this.selection.setSelectionRange(lastUndoRange);
            return lastUndoRange;
        },

        redoChanges: function(deltas, dontSelect) {
            if (!deltas.length)
                return;

            this.$fromUndo = true;
            var lastUndoRange = null;
            for (var i = 0; i < deltas.length; i++) {
                delta = deltas[i];
                if (delta.group == "doc") {
                    this.doc.applyDeltas(delta.deltas);
                    lastUndoRange =
                    this.$getUndoSelection(delta.deltas, false, lastUndoRange);
                }
            }
            this.$fromUndo = false;
            lastUndoRange &&
            !dontSelect &&
            this.selection.setSelectionRange(lastUndoRange);
            return lastUndoRange;
        },

        $getUndoSelection: function(deltas, isUndo, lastUndoRange) {
            function isInsert(delta) {
                var insert =
                delta.action == "insertText" || delta.action == "insertLines";
                return isUndo ? !insert : insert;
            }

            var delta = deltas[0];
            var range, point;
            var lastDeltaIsInsert = false;
            if (isInsert(delta)) {
                range = delta.range.clone();
                lastDeltaIsInsert = true;
            } else {
                range = Range.fromPoints(delta.range.start, delta.range.start);
                lastDeltaIsInsert = false;
            }

            for (var i = 1; i < deltas.length; i++) {
                delta = deltas[i];
                if (isInsert(delta)) {
                    point = delta.range.start;
                    if (range.compare(point.row, point.column) == -1) {
                        range.setStart(delta.range.start);
                    }
                    point = delta.range.end;
                    if (range.compare(point.row, point.column) == 1) {
                        range.setEnd(delta.range.end);
                    }
                    lastDeltaIsInsert = true;
                } else {
                    point = delta.range.start;
                    if (range.compare(point.row, point.column) == -1) {
                        range =
                        Range.fromPoints(delta.range.start, delta.range.start);
                    }
                    lastDeltaIsInsert = false;
                }
            }

            // Check if this range and the last undo range has something in common.
            // If true, merge the ranges.
            if (lastUndoRange != null) {
                var cmp = lastUndoRange.compareRange(range);
                if (cmp == 1) {
                    range.setStart(lastUndoRange.start);
                } else if (cmp == -1) {
                    range.setEnd(lastUndoRange.end);
                }
            }

            return range;
        },

        replace: function(range, text) {
            return this.doc.replace(range, text);
        },

        /**
        * Move a range of text from the given range to the given position.
        *
        * @param fromRange {Range} The range of text you want moved within the
        * document.
        * @param toPosition {Object} The location (row and column) where you want
        * to move the text to.
        * @return {Range} The new range where the text was moved to.
        */
        moveText: function(fromRange, toPosition) {
            var text = this.getTextRange(fromRange);
            this.remove(fromRange);

            var toRow = toPosition.row;
            var toColumn = toPosition.column;

            // Make sure to update the insert location, when text is removed in
            // front of the chosen point of insertion.
            if (!fromRange.isMultiLine() && fromRange.start.row == toRow &&
            fromRange.end.column < toColumn)
                toColumn -= text.length;

            if (fromRange.isMultiLine() && fromRange.end.row < toRow) {
                var lines = this.doc.$split(text);
                toRow -= lines.length - 1;
            }

            var endRow = toRow + fromRange.end.row - fromRange.start.row;
            var endColumn = fromRange.isMultiLine() ?
                        fromRange.end.column :
                        toColumn + fromRange.end.column - fromRange.start.column;

            var toRange = new Range(toRow, toColumn, endRow, endColumn);

            this.insert(toRange.start, text);

            return toRange;
        },

        indentRows: function(startRow, endRow, indentString) {
            indentString = indentString.replace(/\t/g, this.getTabString());
            for (var row = startRow; row <= endRow; row++)
                this.insert({ row: row, column: 0 }, indentString);
        },

        outdentRows: function(range) {
            var rowRange = range.collapseRows();
            var deleteRange = new Range(0, 0, 0, 0);
            var size = this.getTabSize();

            for (var i = rowRange.start.row; i <= rowRange.end.row; ++i) {
                var line = this.getLine(i);

                deleteRange.start.row = i;
                deleteRange.end.row = i;
                for (var j = 0; j < size; ++j)
                    if (line.charAt(j) != ' ')
                    break;
                if (j < size && line.charAt(j) == '\t') {
                    deleteRange.start.column = j;
                    deleteRange.end.column = j + 1;
                } else {
                    deleteRange.start.column = 0;
                    deleteRange.end.column = j;
                }
                this.remove(deleteRange);
            }
        },

        moveLinesUp: function(firstRow, lastRow) {
            if (firstRow <= 0) return 0;

            var removed = this.doc.removeLines(firstRow, lastRow);
            this.doc.insertLines(firstRow - 1, removed);
            return -1;
        },

        moveLinesDown: function(firstRow, lastRow) {
            if (lastRow >= this.doc.getLength() - 1) return 0;

            var removed = this.doc.removeLines(firstRow, lastRow);
            this.doc.insertLines(firstRow + 1, removed);
            return 1;
        },

        duplicateLines: function(firstRow, lastRow) {
            var firstRow = this.$clipRowToDocument(firstRow);
            var lastRow = this.$clipRowToDocument(lastRow);

            var lines = this.getLines(firstRow, lastRow);
            this.doc.insertLines(firstRow, lines);

            var addedRows = lastRow - firstRow + 1;
            return addedRows;
        },

        $clipRowToDocument: function(row) {
            return Math.max(0, Math.min(row, this.doc.getLength() - 1));
        },

        $clipColumnToRow: function(row, column) {
            if (column < 0)
                return 0;
            return Math.min(this.doc.getLine(row).length, column);
        },

        $clipPositionToDocument: function(row, column) {
            column = Math.max(0, column);

            if (row < 0) {
                row = 0;
                column = 0;
            } else {
                var len = this.doc.getLength();
                if (row >= len) {
                    row = len - 1;
                    column = this.doc.getLine(len - 1).length;
                } else {
                    column = Math.min(this.doc.getLine(row).length, column);
                }
            }

            return {
                row: row,
                column: column
            };
        },

        $clipRangeToDocument: function(range) {
            if (range.start.row < 0) {
                range.start.row = 0;
                range.start.column = 0
            } else {
                range.start.column = this.$clipColumnToRow(
                range.start.row,
                range.start.column
            );
            }

            var len = this.doc.getLength() - 1;
            if (range.end.row > len) {
                range.end.row = len;
                range.end.column = this.doc.getLine(len).length;
            } else {
                range.end.column = this.$clipColumnToRow(
                range.end.row,
                range.end.column
            );
            }
            return range;
        },

        // WRAPMODE
        $wrapLimit: 80,
        $useWrapMode: false,

        setUseWrapMode: function(useWrapMode) {
            if (useWrapMode != this.$useWrapMode) {
                this.$useWrapMode = useWrapMode;
                this.$modified = true;
                this.$resetRowCache(0);

                // If wrapMode is activaed, the wrapData array has to be initialized.
                if (useWrapMode) {
                    var len = this.getLength();
                    this.$wrapData = [];
                    for (i = 0; i < len; i++) {
                        this.$wrapData.push([]);
                    }
                    this.$updateWrapData(0, len - 1);
                }

                this._dispatchEvent("changeWrapMode");
            }
        },

        getUseWrapMode: function() {
            return this.$useWrapMode;
        },

        // Allow the wrap limit to move freely between min and max. Either
        // parameter can be null to allow the wrap limit to be unconstrained
        // in that direction. Or set both parameters to the same number to pin
        // the limit to that value.
        setWrapLimitRange: function(min, max) {
            if (this.$wrapLimitRange.min !== min || this.$wrapLimitRange.max !== max) {
                this.$wrapLimitRange.min = min;
                this.$wrapLimitRange.max = max;
                this.$modified = true;
                // This will force a recalculation of the wrap limit
                this._dispatchEvent("changeWrapMode");
            }
        },

        // This should generally only be called by the renderer when a resize
        // is detected.
        adjustWrapLimit: function(desiredLimit) {
            var wrapLimit = this.$constrainWrapLimit(desiredLimit);
            if (wrapLimit != this.$wrapLimit && wrapLimit > 0) {
                this.$wrapLimit = wrapLimit;
                this.$modified = true;
                if (this.$useWrapMode) {
                    this.$updateWrapData(0, this.getLength() - 1);
                    this.$resetRowCache(0)
                    this._dispatchEvent("changeWrapLimit");
                }
                return true;
            }
            return false;
        },

        $constrainWrapLimit: function(wrapLimit) {
            var min = this.$wrapLimitRange.min;
            if (min)
                wrapLimit = Math.max(min, wrapLimit);

            var max = this.$wrapLimitRange.max;
            if (max)
                wrapLimit = Math.min(max, wrapLimit);

            // What would a limit of 0 even mean?
            return Math.max(1, wrapLimit);
        },

        getWrapLimit: function() {
            return this.$wrapLimit;
        },

        getWrapLimitRange: function() {
            // Avoid unexpected mutation by returning a copy
            return {
                min: this.$wrapLimitRange.min,
                max: this.$wrapLimitRange.max
            };
        },

        $updateInternalDataOnChange: function(e) {
            var useWrapMode = this.$useWrapMode;
            var len;
            var action = e.data.action;
            var firstRow = e.data.range.start.row,
            lastRow = e.data.range.end.row,
            start = e.data.range.start,
            end = e.data.range.end;
            var removedFolds = null;

            if (action.indexOf("Lines") != -1) {
                if (action == "insertLines") {
                    lastRow = firstRow + (e.data.lines.length);
                } else {
                    lastRow = firstRow;
                }
                len = e.data.lines ? e.data.lines.length : lastRow - firstRow;
            } else {
                len = lastRow - firstRow;
            }

            if (len != 0) {
                if (action.indexOf("remove") != -1) {
                    useWrapMode && this.$wrapData.splice(firstRow, len);

                    var foldLines = this.$foldData;
                    removedFolds = this.getFoldsInRange(e.data.range);
                    this.removeFolds(removedFolds);

                    var foldLine = this.getFoldLine(end.row);
                    var idx = 0;
                    if (foldLine) {
                        foldLine.addRemoveChars(end.row, end.column, start.column - end.column);
                        foldLine.shiftRow(-len);

                        var foldLineBefore = this.getFoldLine(firstRow);
                        if (foldLineBefore && foldLineBefore !== foldLine) {
                            foldLineBefore.merge(foldLine);
                            foldLine = foldLineBefore;
                        }
                        idx = foldLines.indexOf(foldLine) + 1;
                    }

                    for (idx; idx < foldLines.length; idx++) {
                        var foldLine = foldLines[idx];
                        if (foldLine.start.row >= end.row) {
                            foldLine.shiftRow(-len);
                        }
                    }

                    lastRow = firstRow;
                } else {
                    var args;
                    if (useWrapMode) {
                        args = [firstRow, 0];
                        for (var i = 0; i < len; i++) args.push([]);
                        this.$wrapData.splice.apply(this.$wrapData, args);
                    }

                    // If some new line is added inside of a foldLine, then split
                    // the fold line up.
                    var foldLines = this.$foldData;
                    var foldLine = this.getFoldLine(firstRow);
                    var idx = 0;
                    if (foldLine) {
                        var cmp = foldLine.range.compareInside(start.row, start.column)
                        // Inside of the foldLine range. Need to split stuff up.
                        if (cmp == 0) {
                            foldLine = foldLine.split(start.row, start.column);
                            foldLine.shiftRow(len);
                            foldLine.addRemoveChars(
                            lastRow, 0, end.column - start.column);
                        } else
                        // Infront of the foldLine but same row. Need to shift column.
                            if (cmp == -1) {
                            foldLine.addRemoveChars(firstRow, 0, end.column - start.column);
                            foldLine.shiftRow(len);
                        }
                        // Nothing to do if the insert is after the foldLine.
                        idx = foldLines.indexOf(foldLine) + 1;
                    }

                    for (idx; idx < foldLines.length; idx++) {
                        var foldLine = foldLines[idx];
                        if (foldLine.start.row >= firstRow) {
                            foldLine.shiftRow(len);
                        }
                    }
                }
            } else {
                // Realign folds. E.g. if you add some new chars before a fold, the
                // fold should "move" to the right.
                var column;
                len = Math.abs(e.data.range.start.column - e.data.range.end.column);
                if (action.indexOf("remove") != -1) {
                    // Get all the folds in the change range and remove them.
                    removedFolds = this.getFoldsInRange(e.data.range);
                    this.removeFolds(removedFolds);

                    len = -len;
                }
                var foldLine = this.getFoldLine(firstRow);
                if (foldLine) {
                    foldLine.addRemoveChars(firstRow, start.column, len);
                }
            }

            if (useWrapMode && this.$wrapData.length != this.doc.getLength()) {
                console.error("doc.getLength() and $wrapData.length have to be the same!");
            }

            useWrapMode && this.$updateWrapData(firstRow, lastRow);

            return removedFolds;
        },

        $updateWrapData: function(firstRow, lastRow) {
            var lines = this.doc.getAllLines();
            var tabSize = this.getTabSize();
            var wrapData = this.$wrapData;
            var wrapLimit = this.$wrapLimit;
            var tokens;
            var foldLine;

            var row = firstRow;
            lastRow = Math.min(lastRow, lines.length - 1);
            while (row <= lastRow) {
                foldLine = this.getFoldLine(row, foldLine);
                if (!foldLine) {
                    tokens = this.$getDisplayTokens(lang.stringTrimRight(lines[row]));
                    wrapData[row] = this.$computeWrapSplits(tokens, wrapLimit, tabSize);
                    row++;
                } else {
                    tokens = [];
                    foldLine.walk(
                    function(placeholder, row, column, lastColumn) {
                        var walkTokens;
                        if (placeholder) {
                            walkTokens = this.$getDisplayTokens(
                                            placeholder, tokens.length);
                            walkTokens[0] = PLACEHOLDER_START;
                            for (var i = 1; i < walkTokens.length; i++) {
                                walkTokens[i] = PLACEHOLDER_BODY;
                            }
                        } else {
                            walkTokens = this.$getDisplayTokens(
                                lines[row].substring(lastColumn, column),
                                tokens.length);
                        }
                        tokens = tokens.concat(walkTokens);
                    } .bind(this),
                    foldLine.end.row,
                    lines[foldLine.end.row].length + 1
                );
                    // Remove spaces/tabs from the back of the token array.
                    while (tokens.length != 0 && tokens[tokens.length - 1] >= SPACE)
                        tokens.pop();

                    wrapData[foldLine.start.row]
                    = this.$computeWrapSplits(tokens, wrapLimit, tabSize);
                    row = foldLine.end.row + 1;
                }
            }
        },

        $computeWrapSplits: function(tokens, wrapLimit, tabSize) {
            if (tokens.length == 0) {
                return [];
            }

            var tabSize = this.getTabSize();
            var splits = [];
            var displayLength = tokens.length;
            var lastSplit = 0, lastDocSplit = 0;

            function addSplit(screenPos) {
                var displayed = tokens.slice(lastSplit, screenPos);

                // The document size is the current size - the extra width for tabs
                // and multipleWidth characters.
                var len = displayed.length;
                displayed.join("").
                // Get all the TAB_SPACEs.
                replace(/12/g, function(m) {
                    len -= 1;
                }).
                // Get all the CHAR_EXT/multipleWidth characters.
                replace(/2/g, function(m) {
                    len -= 1;
                });

                lastDocSplit += len;
                splits.push(lastDocSplit);
                lastSplit = screenPos;
            }

            while (displayLength - lastSplit > wrapLimit) {
                // This is, where the split should be.
                var split = lastSplit + wrapLimit;

                // If there is a space or tab at this split position, then making
                // a split is simple.
                if (tokens[split] >= SPACE) {
                    // Include all following spaces + tabs in this split as well.
                    while (tokens[split] >= SPACE) {
                        split++;
                    }
                    addSplit(split);
                    continue;
                }

                // === ELSE ===
                // Check if split is inside of a placeholder. Placeholder are
                // not splitable. Therefore, seek the beginning of the placeholder
                // and try to place the split beofre the placeholder's start.
                if (tokens[split] == PLACEHOLDER_START
                || tokens[split] == PLACEHOLDER_BODY) {
                    // Seek the start of the placeholder and do the split
                    // before the placeholder. By definition there always
                    // a PLACEHOLDER_START between split and lastSplit.
                    for (split; split != lastSplit - 1; split--) {
                        if (tokens[split] == PLACEHOLDER_START) {
                            // split++; << No incremental here as we want to
                            //  have the position before the Placeholder.
                            break;
                        }
                    }

                    // If the PLACEHOLDER_START is not the index of the
                    // last split, then we can do the split
                    if (split > lastSplit) {
                        addSplit(split);
                        continue;
                    }

                    // If the PLACEHOLDER_START IS the index of the last
                    // split, then we have to place the split after the
                    // placeholder. So, let's seek for the end of the placeholder.
                    split = lastSplit + wrapLimit;
                    for (split; split < tokens.length; split++) {
                        if (tokens[split] != PLACEHOLDER_BODY) {
                            break;
                        }
                    }

                    // If spilt == tokens.length, then the placeholder is the last
                    // thing in the line and adding a new split doesn't make sense.
                    if (split == tokens.length) {
                        break;  // Breaks the while-loop.
                    }

                    // Finally, add the split...
                    addSplit(split);
                    continue;
                }

                // === ELSE ===
                // Search for the first non space/tab/placeholder/punctuation token backwards.
                var minSplit = Math.max(split - 10, lastSplit - 1);
                while (split > minSplit && tokens[split] < PLACEHOLDER_START) {
                    split--;
                }
                while (split > minSplit && tokens[split] == PUNCTUATION) {
                    split--;
                }
                // If we found one, then add the split.
                if (split > minSplit) {
                    addSplit(++split);
                    continue;
                }

                // === ELSE ===
                split = lastSplit + wrapLimit;
                // The split is inside of a CHAR or CHAR_EXT token and no space
                // around -> force a split.
                addSplit(split);
            }
            return splits;
        },

        /**
        * @param
        *   offset: The offset in screenColumn at which position str starts.
        *           Important for calculating the realTabSize.
        */
        $getDisplayTokens: function(str, offset) {
            var arr = [];
            var tabSize;
            offset = offset || 0;

            for (var i = 0; i < str.length; i++) {
                var c = str.charCodeAt(i);
                // Tab
                if (c == 9) {
                    tabSize = this.getScreenTabSize(arr.length + offset);
                    arr.push(TAB);
                    for (var n = 1; n < tabSize; n++) {
                        arr.push(TAB_SPACE);
                    }
                }
                // Space
                else if (c == 32) {
                    arr.push(SPACE);
                } else if ((c > 39 && c < 48) || (c > 57 && c < 64)) {
                    arr.push(PUNCTUATION);
                }
                // full width characters
                else if (c >= 0x1100 && isFullWidth(c)) {
                    arr.push(CHAR, CHAR_EXT);
                } else {
                    arr.push(CHAR);
                }
            }
            return arr;
        },

        /**
        * Calculates the width of the a string on the screen while assuming that
        * the string starts at the first column on the screen.
        *
        * @param string str String to calculate the screen width of
        * @return array
        *      [0]: number of columns for str on screen.
        *      [1]: docColumn position that was read until (useful with screenColumn)
        */
        $getStringScreenWidth: function(str, maxScreenColumn, screenColumn) {
            if (maxScreenColumn == 0) {
                return [0, 0];
            }
            if (maxScreenColumn == null) {
                maxScreenColumn = screenColumn +
                str.length * Math.max(this.getTabSize(), 2);
            }
            screenColumn = screenColumn || 0;

            var c, column;
            for (column = 0; column < str.length; column++) {
                c = str.charCodeAt(column);
                // tab
                if (c == 9) {
                    screenColumn += this.getScreenTabSize(screenColumn);
                }
                // full width characters
                else if (c >= 0x1100 && isFullWidth(c)) {
                    screenColumn += 2;
                } else {
                    screenColumn += 1;
                }
                if (screenColumn > maxScreenColumn) {
                    break
                }
            }

            return [screenColumn, column];
        },

        /**
        * Returns the number of rows required to render this row on the screen
        */
        getRowLength: function(row) {
            if (!this.$useWrapMode || !this.$wrapData[row]) {
                return 1;
            } else {
                return this.$wrapData[row].length + 1;
            }
        },

        /**
        * Returns the height in pixels required to render this row on the screen
        **/
        getRowHeight: function(config, row) {
            return this.getRowLength(row) * config.lineHeight;
        },

        getScreenLastRowColumn: function(screenRow) {
            //return this.screenToDocumentColumn(screenRow, Number.MAX_VALUE / 10)
            return this.documentToScreenColumn(screenRow, this.doc.getLine(screenRow).length);
        },

        getDocumentLastRowColumn: function(docRow, docColumn) {
            var screenRow = this.documentToScreenRow(docRow, docColumn);
            return this.getScreenLastRowColumn(screenRow);
        },

        getDocumentLastRowColumnPosition: function(docRow, docColumn) {
            var screenRow = this.documentToScreenRow(docRow, docColumn);
            return this.screenToDocumentPosition(screenRow, Number.MAX_VALUE / 10);
        },

        getRowSplitData: function(row) {
            if (!this.$useWrapMode) {
                return undefined;
            } else {
                return this.$wrapData[row];
            }
        },

        /**
        * Returns the width of a tab character at screenColumn.
        */
        getScreenTabSize: function(screenColumn) {
            return this.$tabSize - screenColumn % this.$tabSize;
        },

        screenToDocumentRow: function(screenRow, screenColumn) {
            return this.screenToDocumentPosition(screenRow, screenColumn).row;
        },

        screenToDocumentColumn: function(screenRow, screenColumn) {
            return this.screenToDocumentPosition(screenRow, screenColumn).column;
        },

        screenToDocumentPosition: function(screenRow, screenColumn) {
            if (screenRow < 0) {
                return {
                    row: 0,
                    column: 0
                }
            }

            var line;
            var docRow = 0;
            var docColumn = 0;
            var column;
            var foldLineRowLength;
            var row = 0;
            var rowLength = 0;

            var rowCache = this.$rowCache;
            for (var i = 0; i < rowCache.length; i++) {
                if (rowCache[i].screenRow < screenRow) {
                    row = rowCache[i].screenRow;
                    docRow = rowCache[i].docRow;
                }
                else {
                    break;
                }
            }
            var doCache = !rowCache.length || i == rowCache.length;

            var maxRow = this.getLength() - 1;
            var foldLine = this.getNextFoldLine(docRow);
            var foldStart = foldLine ? foldLine.start.row : Infinity;

            while (row <= screenRow) {
                rowLength = this.getRowLength(docRow);
                if (row + rowLength - 1 >= screenRow || docRow >= maxRow) {
                    break;
                } else {
                    row += rowLength;
                    docRow++;
                    if (docRow > foldStart) {
                        docRow = foldLine.end.row + 1;
                        foldLine = this.getNextFoldLine(docRow, foldLine);
                        foldStart = foldLine ? foldLine.start.row : Infinity;
                    }
                }
                if (doCache) {
                    rowCache.push({
                        docRow: docRow,
                        screenRow: row
                    });
                }
            }

            if (foldLine && foldLine.start.row <= docRow) {
                line = this.getFoldDisplayLine(foldLine);
                docRow = foldLine.start.row;
            } else if (row + rowLength <= screenRow || docRow > maxRow) {
                // clip at the end of the document
                return {
                    row: maxRow,
                    column: this.getLine(maxRow).length
                }
            } else {
                line = this.getLine(docRow);
                foldLine = null;
            }

            if (this.$useWrapMode) {
                var splits = this.$wrapData[docRow];
                if (splits) {
                    column = splits[screenRow - row];
                    if (screenRow > row && splits.length) {
                        docColumn = splits[screenRow - row - 1] || splits[splits.length - 1];
                        line = line.substring(docColumn);
                    }
                }
            }

            docColumn += this.$getStringScreenWidth(line, screenColumn)[1];

            // Need to do some clamping action here.
            if (this.$useWrapMode) {
                if (docColumn >= column) {
                    // We remove one character at the end such that the docColumn
                    // position returned is not associated to the next row on the
                    // screen.
                    docColumn = column - 1;
                }
            } else {
                docColumn = Math.min(docColumn, line.length);
            }

            if (foldLine) {
                return foldLine.idxToPosition(docColumn);
            }

            return {
                row: docRow,
                column: docColumn
            }
        },

        documentToScreenPosition: function(docRow, docColumn) {
            // Normalize the passed in arguments.
            if (typeof docColumn === "undefined")
                var pos = this.$clipPositionToDocument(docRow.row, docRow.column);
            else
                pos = this.$clipPositionToDocument(docRow, docColumn);

            docRow = pos.row;
            docColumn = pos.column;

            var LL = this.$rowCache.length;

            var wrapData;
            // Special case in wrapMode if the doc is at the end of the document.
            if (this.$useWrapMode) {
                wrapData = this.$wrapData;
                if (docRow > wrapData.length - 1) {
                    return {
                        row: this.getScreenLength(),
                        column: wrapData.length == 0
                        ? 0
                        : (wrapData[wrapData.length - 1].length - 1)
                    };
                }
            }

            var screenRow = 0;
            var screenColumn = 0;
            var foldStartRow = null;
            var fold = null;

            // Clamp the docRow position in case it's inside of a folded block.
            fold = this.getFoldAt(docRow, docColumn, 1);
            if (fold) {
                docRow = fold.start.row;
                docColumn = fold.start.column;
            }

            var rowEnd, row = 0;
            var rowCache = this.$rowCache;

            for (var i = 0; i < rowCache.length; i++) {
                if (rowCache[i].docRow < docRow) {
                    screenRow = rowCache[i].screenRow;
                    row = rowCache[i].docRow;
                } else {
                    break;
                }
            }
            var doCache = !rowCache.length || i == rowCache.length;

            var foldLine = this.getNextFoldLine(row);
            var foldStart = foldLine ? foldLine.start.row : Infinity;

            while (row < docRow) {
                if (row >= foldStart) {
                    rowEnd = foldLine.end.row + 1;
                    if (rowEnd > docRow)
                        break;
                    foldLine = this.getNextFoldLine(rowEnd, foldLine);
                    foldStart = foldLine ? foldLine.start.row : Infinity;
                }
                else {
                    rowEnd = row + 1;
                }

                screenRow += this.getRowLength(row);
                row = rowEnd;

                if (doCache) {
                    rowCache.push({
                        docRow: row,
                        screenRow: screenRow
                    });
                }
            }

            // Calculate the text line that is displayed in docRow on the screen.
            var textLine = "";
            // Check if the final row we want to reach is inside of a fold.
            if (foldLine && row >= foldStart) {
                textLine = this.getFoldDisplayLine(foldLine, docRow, docColumn);
                foldStartRow = foldLine.start.row;
            } else {
                textLine = this.getLine(docRow).substring(0, docColumn);
                foldStartRow = docRow;
            }
            // Clamp textLine if in wrapMode.
            if (this.$useWrapMode) {
                var wrapRow = wrapData[foldStartRow];
                var screenRowOffset = 0;
                while (textLine.length >= wrapRow[screenRowOffset]) {
                    screenRow++;
                    screenRowOffset++;
                }
                textLine = textLine.substring(
                wrapRow[screenRowOffset - 1] || 0, textLine.length
            );
            }

            return {
                row: screenRow,
                column: this.$getStringScreenWidth(textLine)[0]
            };
        },

        documentToScreenColumn: function(row, docColumn) {
            return this.documentToScreenPosition(row, docColumn).column;
        },

        documentToScreenRow: function(docRow, docColumn) {
            return this.documentToScreenPosition(docRow, docColumn).row;
        },

        getScreenLength: function() {
            var screenRows = 0;
            var fold = null;
            if (!this.$useWrapMode) {
                screenRows = this.getLength();

                // Remove the folded lines again.
                var foldData = this.$foldData;
                for (var i = 0; i < foldData.length; i++) {
                    fold = foldData[i];
                    screenRows -= fold.end.row - fold.start.row;
                }
            } else {
                var lastRow = this.$wrapData.length;
                var row = 0, i = 0;
                var fold = this.$foldData[i++];
                var foldStart = fold ? fold.start.row : Infinity;

                while (row < lastRow) {
                    screenRows += this.$wrapData[row].length + 1;
                    row++;
                    if (row > foldStart) {
                        row = fold.end.row + 1;
                        fold = this.$foldData[i++];
                        foldStart = fold ? fold.start.row : Infinity;
                    }
                }
            }

            return screenRows;
        },

        //TODD Folding


        /**
        * Looks up a fold at a given row/column. Possible values for side:
        *   -1: ignore a fold if fold.start = row/column
        *   +1: ignore a fold if fold.end = row/column
        */
        getFoldAt: function(row, column, side) {
            var foldLine = this.getFoldLine(row);
            if (!foldLine)
                return null;

            var folds = foldLine.folds;
            for (var i = 0; i < folds.length; i++) {
                var fold = folds[i];
                if (fold.range.contains(row, column)) {
                    if (side == 1 && fold.range.isEnd(row, column)) {
                        continue;
                    } else if (side == -1 && fold.range.isStart(row, column)) {
                        continue;
                    }
                    return fold;
                }
            }
        },

        /**
        * Returns all folds in the given range. Note, that this will return folds
        *
        */
        getFoldsInRange: function(range) {
            range = range.clone();
            var start = range.start;
            var end = range.end;
            var foldLines = this.$foldData;
            var foundFolds = [];

            start.column += 1;
            end.column -= 1;

            for (var i = 0; i < foldLines.length; i++) {
                var cmp = foldLines[i].range.compareRange(range);
                if (cmp == 2) {
                    // Range is before foldLine. No intersection. This means,
                    // there might be other foldLines that intersect.
                    continue;
                }
                else if (cmp == -2) {
                    // Range is after foldLine. There can't be any other foldLines then,
                    // so let's give up.
                    break;
                }

                var folds = foldLines[i].folds;
                for (var j = 0; j < folds.length; j++) {
                    var fold = folds[j];
                    cmp = fold.range.compareRange(range);
                    if (cmp == -2) {
                        break;
                    } else if (cmp == 2) {
                        continue;
                    } else
                    // WTF-state: Can happen due to -1/+1 to start/end column.
                        if (cmp == 42) {
                        break;
                    }
                    foundFolds.push(fold);
                }
            }
            return foundFolds;
        },

        /**
        * Returns the string between folds at the given position.
        * E.g.
        *  foo<fold>b|ar<fold>wolrd -> "bar"
        *  foo<fold>bar<fold>wol|rd -> "world"
        *  foo<fold>bar<fo|ld>wolrd -> <null>
        *
        * where | means the position of row/column
        *
        * The trim option determs if the return string should be trimed according
        * to the "side" passed with the trim value:
        *
        * E.g.
        *  foo<fold>b|ar<fold>wolrd -trim=-1> "b"
        *  foo<fold>bar<fold>wol|rd -trim=+1> "rld"
        *  fo|o<fold>bar<fold>wolrd -trim=00> "foo"
        */
        getFoldStringAt: function(row, column, trim, foldLine) {
            foldLine = foldLine || this.getFoldLine(row);
            if (!foldLine)
                return null;

            var lastFold = {
                end: { column: 0 }
            };
            // TODO: Refactor to use getNextFoldTo function.
            var str, fold;
            for (var i = 0; i < foldLine.folds.length; i++) {
                fold = foldLine.folds[i];
                var cmp = fold.range.compareEnd(row, column);
                if (cmp == -1) {
                    str = this
                    .getLine(fold.start.row)
                    .substring(lastFold.end.column, fold.start.column);
                    break;
                }
                else if (cmp === 0) {
                    return null;
                }
                lastFold = fold;
            }
            if (!str)
                str = this.getLine(fold.start.row).substring(lastFold.end.column);

            if (trim == -1)
                return str.substring(0, column - lastFold.end.column);
            else if (trim == 1)
                return str.substring(column - lastFold.end.column);
            else
                return str;
        },

        getFoldLine: function(docRow, startFoldLine) {
            var foldData = this.$foldData;
            var i = 0;
            if (startFoldLine)
                i = foldData.indexOf(startFoldLine);
            if (i == -1)
                i = 0;
            for (i; i < foldData.length; i++) {
                var foldLine = foldData[i];
                if (foldLine.start.row <= docRow && foldLine.end.row >= docRow) {
                    return foldLine;
                } else if (foldLine.end.row > docRow) {
                    return null;
                }
            }
            return null;
        },

        // returns the fold which starts after or contains docRow
        getNextFoldLine: function(docRow, startFoldLine) {

            var foldData = this.$foldData;
            var i = 0;
            if (startFoldLine)
                i = foldData.indexOf(startFoldLine);
            if (i == -1)
                i = 0;
            for (i; i < foldData.length; i++) {
                var foldLine = foldData[i];
                if (foldLine.end.row >= docRow) {
                    return foldLine;
                }
            }
            return null;
        },

        getFoldedRowCount: function(first, last) {
            var foldData = this.$foldData, rowCount = last - first + 1;
            for (var i = 0; i < foldData.length; i++) {
                var foldLine = foldData[i],
                end = foldLine.end.row,
                start = foldLine.start.row;
                if (end >= last) {
                    if (start < last) {
                        if (start >= first)
                            rowCount -= last - start;
                        else
                            rowCount = 0; //in one fold
                    }
                    break;
                } else if (end >= first) {
                    if (start >= first) //fold inside range
                        rowCount -= end - start;
                    else
                        rowCount -= end - first + 1;
                }
            }
            return rowCount;
        },

        $addFoldLine: function(foldLine) {
            this.$foldData.push(foldLine);
            this.$foldData.sort(function(a, b) {
                return a.start.row - b.start.row;
            });
            return foldLine;
        },

        /**
        * Adds a new fold.
        *
        * @returns
        *      The new created Fold object or an existing fold object in case the
        *      passed in range fits an existing fold exactly.
        */
        addFold: function(placeholder, range) {
            var foldData = this.$foldData;
            var added = false;
            var fold;

            if (placeholder instanceof Fold)
                fold = placeholder;
            else
                fold = new Fold(range, placeholder);

            this.$clipRangeToDocument(fold.range);

            var startRow = fold.start.row;
            var startColumn = fold.start.column;
            var endRow = fold.end.row;
            var endColumn = fold.end.column;

            // --- Some checking ---
            if (fold.placeholder.length < 2)
                throw "Placeholder has to be at least 2 characters";

            if (startRow == endRow && endColumn - startColumn < 2)
                throw "The range has to be at least 2 characters width";

            var startFold = this.getFoldAt(startRow, startColumn, 1);
            var endFold = this.getFoldAt(endRow, endColumn, -1);
            if (startFold && endFold == startFold)
                return startFold.addSubFold(fold);

            if (
                    (startFold && !startFold.range.isStart(startRow, startColumn))
                        || (endFold && !endFold.range.isEnd(endRow, endColumn))
                    ) {
                throw "A fold can't intersect already existing fold" + fold.range + startFold.range;
            }

            // Check if there are folds in the range we create the new fold for.
            var folds = this.getFoldsInRange(fold.range);
            if (folds.length > 0) {
                // Remove the folds from fold data.
                this.removeFolds(folds);
                // Add the removed folds as subfolds on the new fold.
                fold.subFolds = folds;
            }

            for (var i = 0; i < foldData.length; i++) {
                var foldLine = foldData[i];
                if (endRow == foldLine.start.row) {
                    foldLine.addFold(fold);
                    added = true;
                    break;
                }
                else if (startRow == foldLine.end.row) {
                    foldLine.addFold(fold);
                    added = true;
                    if (!fold.sameRow) {
                        // Check if we might have to merge two FoldLines.
                        var foldLineNext = foldData[i + 1];
                        if (foldLineNext && foldLineNext.start.row == endRow) {
                            // We need to merge!
                            foldLine.merge(foldLineNext);
                            break;
                        }
                    }
                    break;
                }
                else if (endRow <= foldLine.start.row) {
                    break;
                }
            }

            if (!added)
                foldLine = this.$addFoldLine(new FoldLine(this.$foldData, fold));

            if (this.$useWrapMode)
                this.$updateWrapData(foldLine.start.row, foldLine.start.row);

            // Notify that fold data has changed.
            this.$modified = true;
            this._dispatchEvent("changeFold", { data: fold });

            return fold;
        },

        addFolds: function(folds) {
            folds.forEach(function(fold) {
                this.addFold(fold);
            }, this);
        },

        removeFold: function(fold) {
            var foldLine = fold.foldLine;
            var startRow = foldLine.start.row;
            var endRow = foldLine.end.row;

            var foldLines = this.$foldData,
                    folds = foldLine.folds;
            // Simple case where there is only one fold in the FoldLine such that
            // the entire fold line can get removed directly.
            if (folds.length == 1) {
                foldLines.splice(foldLines.indexOf(foldLine), 1);
            } else
            // If the fold is the last fold of the foldLine, just remove it.
                if (foldLine.range.isEnd(fold.end.row, fold.end.column)) {
                folds.pop();
                foldLine.end.row = folds[folds.length - 1].end.row;
                foldLine.end.column = folds[folds.length - 1].end.column;
            } else
            // If the fold is the first fold of the foldLine, just remove it.
                if (foldLine.range.isStart(fold.start.row, fold.start.column)) {
                folds.shift();
                foldLine.start.row = folds[0].start.row;
                foldLine.start.column = folds[0].start.column;
            } else
            // We know there are more then 2 folds and the fold is not at the edge.
            // This means, the fold is somewhere in between.
            //
            // If the fold is in one row, we just can remove it.
                if (fold.sameRow) {
                folds.splice(folds.indexOf(fold), 1);
            } else
            // The fold goes over more then one row. This means remvoing this fold
            // will cause the fold line to get splitted up. newFoldLine is the second part
            {
                var newFoldLine = foldLine.split(fold.start.row, fold.start.column);
                folds = newFoldLine.folds;
                folds.shift();
                newFoldLine.start.row = folds[0].start.row;
                newFoldLine.start.column = folds[0].start.column;
            }

            if (this.$useWrapMode) {
                this.$updateWrapData(startRow, endRow);
            }

            // Notify that fold data has changed.
            this.$modified = true;
            this._dispatchEvent("changeFold", { data: fold });
        },

        removeFolds: function(folds) {
            // We need to clone the folds array passed in as it might be the folds
            // array of a fold line and as we call this.removeFold(fold), folds
            // are removed from folds and changes the current index.
            var cloneFolds = [];
            for (var i = 0; i < folds.length; i++) {
                cloneFolds.push(folds[i]);
            }

            cloneFolds.forEach(function(fold) {
                this.removeFold(fold);
            }, this);
            this.$modified = true;
        },

        expandFold: function(fold) {
            this.removeFold(fold);
            fold.subFolds.forEach(function(fold) {
                this.addFold(fold);
            }, this);
            fold.subFolds = [];
        },

        expandFolds: function(folds) {
            folds.forEach(function(fold) {
                this.expandFold(fold);
            }, this);
        },

        unfold: function(location, expandInner) {
            var range, folds;
            if (location == null)
                range = new Range(0, 0, this.getLength(), 0);
            else if (typeof location == "number")
                range = new Range(location, 0, location, this.getLine(location).length);
            else if ("row" in location)
                range = Range.fromPoints(location, location);
            else
                range = location;

            folds = this.getFoldsInRange(range);
            if (expandInner) {
                this.removeFolds(folds);
            } else {
                // TODO: might need to remove and add folds in one go instead of using
                // expandFolds several times.
                while (folds.length) {
                    this.expandFolds(folds);
                    folds = this.getFoldsInRange(range);
                }
            }
        },

        /**
        * Checks if a given documentRow is folded. This is true if there are some
        * folded parts such that some parts of the line is still visible.
        **/
        isRowFolded: function(docRow, startFoldRow) {
            return !!this.getFoldLine(docRow, startFoldRow);
        },

        getRowFoldEnd: function(docRow, startFoldRow) {
            var foldLine = this.getFoldLine(docRow, startFoldRow);
            return (foldLine
                    ? foldLine.end.row
                    : docRow)
        },

        getFoldDisplayLine: function(foldLine, endRow, endColumn, startRow, startColumn) {
            if (startRow == null) {
                startRow = foldLine.start.row;
                startColumn = 0;
            }

            if (endRow == null) {
                endRow = foldLine.end.row;
                endColumn = this.getLine(endRow).length;
            }

            // Build the textline using the FoldLine walker.
            var doc = this.doc;
            var textLine = "";

            foldLine.walk(function(placeholder, row, column, lastColumn, isNewRow) {
                if (row < startRow) {
                    return;
                } else if (row == startRow) {
                    if (column < startColumn) {
                        return;
                    }
                    lastColumn = Math.max(startColumn, lastColumn);
                }
                if (placeholder) {
                    textLine += placeholder;
                } else {
                    textLine += doc.getLine(row).substring(lastColumn, column);
                }
            } .bind(this), endRow, endColumn);
            return textLine;
        },

        getDisplayLine: function(row, endColumn, startRow, startColumn) {
            var foldLine = this.getFoldLine(row);

            if (!foldLine) {
                var line;
                line = this.doc.getLine(row);
                return line.substring(startColumn || 0, endColumn || line.length);
            } else {
                return this.getFoldDisplayLine(
                foldLine, row, endColumn, startRow, startColumn);
            }
        },

        $cloneFoldData: function() {
            var fd = [];
            fd = this.$foldData.map(function(foldLine) {
                var folds = foldLine.folds.map(function(fold) {
                    return fold.clone();
                });
                return new FoldLine(fd, folds);
            });

            return fd;
        },

        toggleFold: function(tryToUnfold) {
            var selection = this.selection;
            var range = selection.getRange();

            if (range.isEmpty()) {
                var cursor = range.start;
                var fold = this.getFoldAt(cursor.row, cursor.column);
                var bracketPos;

                if (fold) {
                    this.expandFold(fold);
                    return;
                } else if (bracketPos = this.findMatchingBracket(cursor)) {
                    if (range.comparePoint(bracketPos) == 1) {
                        range.end = bracketPos;
                    } else {
                        range.start = bracketPos;
                        range.start.column++;
                        range.end.column--;
                    }
                } else if (bracketPos = this.findMatchingBracket({ row: cursor.row, column: cursor.column + 1 })) {
                    if (range.comparePoint(bracketPos) == 1)
                        range.end = bracketPos;
                    else
                        range.start = bracketPos;

                    range.start.column++;
                } else {
                    range = this.getCommentFoldRange(cursor.row, cursor.column) || range;
                }
            } else {
                var folds = this.getFoldsInRange(range);
                if (tryToUnfold && folds.length) {
                    this.expandFolds(folds);
                    return;
                } else if (folds.length == 1) {
                    fold = folds[0];
                }
            }

            if (!fold)
                fold = this.getFoldAt(range.start.row, range.start.column);

            if (fold && fold.range.toString() == range.toString()) {
                this.expandFold(fold);
                return;
            }

            var placeholder = "...";
            if (!range.isMultiLine()) {
                placeholder = this.getTextRange(range);
                if (placeholder.length < 4)
                    return;
                placeholder = placeholder.trim().substring(0, 2) + "..";
            }

            this.addFold(placeholder, range);
        },

        getCommentFoldRange: function(row, column) {

            var iterator = new TokenIterator(this, row, column);
            var token = iterator.getCurrentToken();
            if (token && /^comment|string/.test(token.type)) {

                var range = new Range();
                var t;
                do {
                    t = iterator.stepBackward();
                } while (t && t.type == token.type);

                iterator.stepForward();
                range.start.row = iterator.getCurrentTokenRow();
                range.start.column = iterator.getCurrentTokenColumn() + 2;

                var iterator = new TokenIterator(this, row, column);

                do {
                    t = iterator.stepForward();
                } while (t && t.type == token.type);
                t = iterator.stepBackward();

                range.end.row = iterator.getCurrentTokenRow();
                range.end.column = iterator.getCurrentTokenColumn() + t.value.length - 1;
                return range;
            }
        },

        foldAll: function() {
            var foldWidgets = this.foldWidgets;
            for (var row = foldWidgets.length; row--; ) {
                if (foldWidgets[row] == null)
                    foldWidgets[row] = this.getFoldWidget(row);
                if (foldWidgets[row] != "start")
                    continue;

                var range = this.getFoldWidgetRange(row);
                if (range)
                    this.addFold("...", range);
            }
        },

        // structured folding
        $setFolding: function(foldMode) {

            if (this.$foldMode == foldMode)
                return;
            this.$foldMode = foldMode;

            this.removeListener('change', this.$updateFoldWidgets);

            if (!foldMode) {
                this.foldWidgets = null;
                return;
            }

            this.foldWidgets = [];
            this.getFoldWidget = foldMode.getFoldWidget.bind(foldMode, this);
            this.getFoldWidgetRange = foldMode.getFoldWidgetRange.bind(foldMode, this);

            this.$updateFoldWidgets = this.updateFoldWidgets.bind(this);
            this.on('change', this.$updateFoldWidgets);
        },

        onFoldWidgetClick: function(row, htmlEvent) {
            var type = this.getFoldWidget(row);
            var line = this.getLine(row);
            var fold;

            if (type == "end")
                fold = this.getFoldAt(row, 0, -1);
            else
                fold = this.getFoldAt(row, line.length, 1);

            if (fold) {
                this.expandFold(fold);
                return;
            }

            var range = this.getFoldWidgetRange(row);
            if (range)
                this.addFold("...", range);
        },

        updateFoldWidgets: function(e) {
            var delta = e.data;
            var range = delta.range;
            var firstRow = range.start.row;
            var len = range.end.row - firstRow;

            if (len === 0) {
                this.foldWidgets[firstRow] = null;
            } else if (delta.action == "removeText" || delta.action == "removeLines") {
                this.foldWidgets.splice(firstRow, len + 1, null);
            } else {
                var args = Array(len + 1);
                args.unshift(firstRow, 1);
                this.foldWidgets.splice.apply(this.foldWidgets, args);
            }
        },

        //TODD BracketMatch


        findMatchingBracket: function(position) {
            if (position.column == 0) return null;

            var charBeforeCursor = this.getLine(position.row).charAt(position.column - 1);
            if (charBeforeCursor == "") return null;

            var match = charBeforeCursor.match(/([\(\[\{])|([\)\]\}])/);
            if (!match) {
                return null;
            }

            if (match[1]) {
                return this.$findClosingBracket(match[1], position);
            } else {
                return this.$findOpeningBracket(match[2], position);
            }
        },

        $findOpeningBracket: function(bracket, position) {
            var openBracket = this.$brackets[bracket];
            var depth = 1;

            var iterator = new TokenIterator(this, position.row, position.column);
            var token = iterator.getCurrentToken();
            if (!token) return null;

            // token.type contains a period-delimited list of token identifiers
            // (e.g.: "constant.numeric" or "paren.lparen").  Create a pattern that
            // matches any token containing the same identifiers or a subset.  In
            // addition, if token.type includes "rparen", then also match "lparen".
            // So if type.token is "paren.rparen", then typeRe will match "lparen.paren".
            var typeRe = new RegExp("(\\.?" +
                    token.type.replace(".", "|").replace("rparen", "lparen|rparen") + ")+");

            // Start searching in token, just before the character at position.column
            var valueIndex = position.column - iterator.getCurrentTokenColumn() - 2;
            var value = token.value;

            while (true) {

                while (valueIndex >= 0) {
                    var char = value.charAt(valueIndex);
                    if (char == openBracket) {
                        depth -= 1;
                        if (depth == 0) {
                            return { row: iterator.getCurrentTokenRow(),
                                column: valueIndex + iterator.getCurrentTokenColumn()
                            };
                        }
                    }
                    else if (char == bracket) {
                        depth += 1;
                    }
                    valueIndex -= 1;
                }

                // Scan backward through the document, looking for the next token
                // whose type matches typeRe
                do {
                    token = iterator.stepBackward();
                } while (token && !typeRe.test(token.type));

                if (token == null)
                    break;

                value = token.value;
                valueIndex = value.length - 1;
            }

            return null;
        },

        $findClosingBracket: function(bracket, position) {
            var closingBracket = this.$brackets[bracket];
            var depth = 1;

            var iterator = new TokenIterator(this, position.row, position.column);
            var token = iterator.getCurrentToken();
            if (!token) return null;

            // token.type contains a period-delimited list of token identifiers
            // (e.g.: "constant.numeric" or "paren.lparen").  Create a pattern that
            // matches any token containing the same identifiers or a subset.  In
            // addition, if token.type includes "lparen", then also match "rparen".
            // So if type.token is "lparen.paren", then typeRe will match "paren.rparen".
            var typeRe = new RegExp("(\\.?" +
                    token.type.replace(".", "|").replace("lparen", "lparen|rparen") + ")+");

            // Start searching in token, after the character at position.column
            var valueIndex = position.column - iterator.getCurrentTokenColumn();

            while (true) {

                var value = token.value;
                var valueLength = value.length;
                while (valueIndex < valueLength) {
                    var char = value.charAt(valueIndex);
                    if (char == closingBracket) {
                        depth -= 1;
                        if (depth == 0) {
                            return { row: iterator.getCurrentTokenRow(),
                                column: valueIndex + iterator.getCurrentTokenColumn()
                            };
                        }
                    }
                    else if (char == bracket) {
                        depth += 1;
                    }
                    valueIndex += 1;
                }

                // Scan forward through the document, looking for the next token
                // whose type matches typeRe
                do {
                    token = iterator.stepForward();
                } while (token && !typeRe.test(token.type));

                if (token == null)
                    break;

                valueIndex = 0;
            }

            return null;
        }

    });

});
