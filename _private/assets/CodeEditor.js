

		var event = require("ace/lib/event");
		var useragent = require("ace/lib/useragent");
		var dom = require("ace/lib/dom");



/**
 * 表示一个代码编辑器。
 */
var CodeEditor = Class({

	constructor : function(containerElement, document) {
		this.node = containerElement;
		this.document = document || new CodeEditor.Document();
		this.view = new CodeEditor.View(this);
		this.textInput = new CodeEditor.TextInput(this);

	},
	setKeyboardHandler : function(keyboardHandler) {
		this.keyBinding.setKeyboardHandler(keyboardHandler);
	},
	getKeyboardHandler : function() {
		return this.keyBinding.getKeyboardHandler();
	},
	setSession : function(session) {
		if(this.session == session) {
			return;
		}
		if(this.session) {
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
			this.session.removeEventListener("changeAnnotation", this.$onChangeAnnotation);
			this.session.removeEventListener("changeOverwrite", this.$onCursorChange);
			this.session.removeEventListener("changeScrollTop", this.$onScrollTopChange);
			this.session.removeEventListener("changeLeftTop", this.$onScrollLeftChange);
			var selection = this.session.getSelection();
			selection.removeEventListener("changeCursor", this.$onCursorChange);
			selection.removeEventListener("changeSelection", this.$onSelectionChange);
		}
		this.session = session;
		this.$onDocumentChange = this.onDocumentChange.bind(this);
		session.addEventListener("change", this.$onDocumentChange);
		this.renderer.setSession(session);
		this.$onChangeMode = this.onChangeMode.bind(this);
		session.addEventListener("changeMode", this.$onChangeMode);
		this.$onTokenizerUpdate = this.onTokenizerUpdate.bind(this);
		session.addEventListener("tokenizerUpdate", this.$onTokenizerUpdate);
		this.$onChangeTabSize = this.renderer.onChangeTabSize.bind(this.renderer);
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
		this.$onChangeAnnotation = this.onChangeAnnotation.bind(this);
		this.session.addEventListener("changeAnnotation", this.$onChangeAnnotation);
		this.$onCursorChange = this.onCursorChange.bind(this);
		this.session.addEventListener("changeOverwrite", this.$onCursorChange);
		this.$onScrollTopChange = this.onScrollTopChange.bind(this);
		this.session.addEventListener("changeScrollTop", this.$onScrollTopChange);
		this.$onScrollLeftChange = this.onScrollLeftChange.bind(this);
		this.session.addEventListener("changeScrollLeft", this.$onScrollLeftChange);
		this.selection = session.getSelection();
		this.selection.addEventListener("changeCursor", this.$onCursorChange);
		this.$onSelectionChange = this.onSelectionChange.bind(this);
		this.selection.addEventListener("changeSelection", this.$onSelectionChange);
		this.onChangeMode();
		this.$blockScrolling += 1;
		this.onCursorChange();
		this.$blockScrolling -= 1;
		this.onScrollTopChange();
		this.onScrollLeftChange();
		this.onSelectionChange();
		this.onChangeFrontMarker();
		this.onChangeBackMarker();
		this.onChangeBreakpoint();
		this.onChangeAnnotation(); this.session.getUseWrapMode() && this.renderer.adjustWrapLimit();
		this.renderer.updateFull();
		this._emit("changeSession", {
			session : session,
			oldSession : oldSession
		});
	},
	getSession : function() {
		return this.session;
	},
	setValue : function(val, cursorPos) {
		this.session.doc.setValue(val);
		if(!cursorPos) {
			this.selectAll();
		} else if(cursorPos == 1) {
			this.navigateFileEnd();
		} else if(cursorPos == -1) {
			this.navigateFileStart();
		}
		return val;
	},
	getValue : function() {
		return this.session.getValue();
	},
	getSelection : function() {
		return this.selection;
	},
	resize : function(force) {
		this.renderer.onResize(force);
	},
	setTheme : function(theme) {
		this.renderer.setTheme(theme);
	},
	getTheme : function() {
		return this.renderer.getTheme();
	},
	setStyle : function(style) {
		this.renderer.setStyle(style);
	},
	unsetStyle : function(style) {
		this.renderer.unsetStyle(style);
	},
	setFontSize : function(size) {
		this.container.style.fontSize = size;
		this.renderer.updateFontSize();
	},
	$highlightBrackets : function() {
		if(this.session.$bracketHighlight) {
			this.session.removeMarker(this.session.$bracketHighlight);
			this.session.$bracketHighlight = null;
		}
		if(this.$highlightPending) {
			return;
		}
		var self = this;
		this.$highlightPending = true;
		setTimeout(function() {
			self.$highlightPending = false;
			var pos = self.session.findMatchingBracket(self.getCursorPosition());
			if(pos) {
				var range = new Range(pos.row, pos.column, pos.row, pos.column + 1);
				self.session.$bracketHighlight = self.session.addMarker(range, "ace_bracket", "text");
			}
		}, 50);
	},
	focus : function() {
		var _self = this;
		setTimeout(function() {
			_self.textInput.focus();
		});
		this.textInput.focus();
	},
	isFocused : function() {
		return this.textInput.isFocused();
	},
	blur : function() {
		this.textInput.blur();
	},
	onFocus : function() {
		if(this.$isFocused) {
			return;
		}
		this.$isFocused = true;
		this.renderer.showCursor();
		this.renderer.visualizeFocus();
		this._emit("focus");
	},
	onBlur : function() {
		if(!this.$isFocused) {
			return;
		}
		this.$isFocused = false;
		this.renderer.hideCursor();
		this.renderer.visualizeBlur();
		this._emit("blur");
	},
	$cursorChange : function() {
		this.renderer.updateCursor();
	},
	onDocumentChange : function(e) {
		var delta = e.data;
		var range = delta.range;
		var lastRow;
		if(range.start.row == range.end.row && delta.action != "insertLines" && delta.action != "removeLines") {
			lastRow = range.end.row;
		} else {
			lastRow = Infinity;
		}
		this.renderer.updateLines(range.start.row, lastRow);
		this._emit("change", e);
		this.$cursorChange();
	},
	onTokenizerUpdate : function(e) {
		var rows = e.data;
		this.renderer.updateLines(rows.first, rows.last);
	},
	onScrollTopChange : function() {
		this.renderer.scrollToY(this.session.getScrollTop());
	},
	onScrollLeftChange : function() {
		this.renderer.scrollToX(this.session.getScrollLeft());
	},
	onCursorChange : function() {
		this.$cursorChange();
		if(!this.$blockScrolling) {
			this.renderer.scrollCursorIntoView();
		}
		this.$highlightBrackets();
		this.$updateHighlightActiveLine();
		this._emit("changeSelection");
	},
	$updateHighlightActiveLine : function() {
		var session = this.getSession();
		var highlight;
		if(this.$highlightActiveLine) {
			if(this.$selectionStyle != "line" || !this.selection.isMultiLine()) {
				highlight = this.getCursorPosition();
			}
		}
		if(session.$highlightLineMarker && !highlight) {
			session.removeMarker(session.$highlightLineMarker.id);
			session.$highlightLineMarker = null;
		} else if(!session.$highlightLineMarker && highlight) {
			session.$highlightLineMarker = session.highlightLines(highlight.row, highlight.row, "ace_active-line");
		} else if(highlight) {
			session.$highlightLineMarker.start.row = highlight.row;
			session.$highlightLineMarker.end.row = highlight.row;
			session._emit("changeBackMarker");
		}
	},
	onSelectionChange : function(e) {
		var session = this.session;
		if(session.$selectionMarker) {
			session.removeMarker(session.$selectionMarker);
		}
		session.$selectionMarker = null;
		if(!this.selection.isEmpty()) {
			var range = this.selection.getRange();
			var style = this.getSelectionStyle();
			session.$selectionMarker = session.addMarker(range, "ace_selection", style);
		} else {
			this.$updateHighlightActiveLine();
		}
		var re = this.$highlightSelectedWord && this.$getSelectionHighLightRegexp();
		this.session.highlight(re);
		this._emit("changeSelection");
	},
	$getSelectionHighLightRegexp : function() {
		var session = this.session;
		var selection = this.getSelectionRange();
		if(selection.isEmpty() || selection.isMultiLine()) {
			return;
		}
		var startOuter = selection.start.column - 1;
		var endOuter = selection.end.column + 1;
		var line = session.getLine(selection.start.row);
		var lineCols = line.length;
		var needle = line.substring(Math.max(startOuter, 0), Math.min(endOuter, lineCols));
		if(startOuter >= 0 && /^[\w\d]/.test(needle) || endOuter <= lineCols && /[\w\d]$/.test(needle)) {
			return;
		}
		needle = line.substring(selection.start.column, selection.end.column);
		if(!/^[\w\d]+$/.test(needle)) {
			return;
		}
		var re = this.$search.$assembleRegExp({
			wholeWord : true,
			caseSensitive : true,
			needle : needle
		});
		return re;
	},
	onChangeFrontMarker : function() {
		this.renderer.updateFrontMarkers();
	},
	onChangeBackMarker : function() {
		this.renderer.updateBackMarkers();
	},
	onChangeBreakpoint : function() {
		this.renderer.updateBreakpoints();
	},
	onChangeAnnotation : function() {
		this.renderer.setAnnotations(this.session.getAnnotations());
	},
	onChangeMode : function() {
		this.renderer.updateText();
	},
	onChangeWrapLimit : function() {
		this.renderer.updateFull();
	},
	onChangeWrapMode : function() {
		this.renderer.onResize(true);
	},
	onChangeFold : function() {
		this.$updateHighlightActiveLine();
		this.renderer.updateFull();
	},
	getCopyText : function() {
		var text = "";
		if(!this.selection.isEmpty()) {
			text = this.session.getTextRange(this.getSelectionRange());
		}
		this._emit("copy", text);
		return text;
	},
	onCopy : function() {
		this.commands.exec("copy", this);
	},
	onCut : function() {
		this.commands.exec("cut", this);
	},
	onPaste : function(text) {
		if(this.$readOnly) {
			return;
		}
		this._emit("paste", text);
		this.insert(text);
	},
	execCommand : function(command, args) {
		this.commands.exec(command, this, args);
	},
	insert : function(text) {
		var session = this.session;
		var mode = session.getMode();
		var cursor = this.getCursorPosition();
		if(this.getBehavioursEnabled()) {
			var transform = mode.transformAction(session.getState(cursor.row), "insertion", this, session, text);
			if(transform) {
				text = transform.text;
			}
		}
		text = text.replace("\t", this.session.getTabString());
		if(!this.selection.isEmpty()) {
			cursor = this.session.remove(this.getSelectionRange());
			this.clearSelection();
		} else if(this.session.getOverwrite()) {
			var range = new Range.fromPoints(cursor, cursor);
			range.end.column += text.length;
			this.session.remove(range);
		}
		this.clearSelection();
		var start = cursor.column;
		var lineState = session.getState(cursor.row);
		var line = session.getLine(cursor.row);
		var shouldOutdent = mode.checkOutdent(lineState, line, text);
		var end = session.insert(cursor, text);
		if(transform && transform.selection) {
			if(transform.selection.length == 2) {
				this.selection.setSelectionRange(new Range(cursor.row, start + transform.selection[0], cursor.row, start + transform.selection[1]));
			} else {
				this.selection.setSelectionRange(new Range(cursor.row + transform.selection[0], transform.selection[1], cursor.row + transform.selection[2], transform.selection[3]));
			}
		}
		if(session.getDocument().isNewLine(text)) {
			var lineIndent = mode.getNextLineIndent(lineState, line.slice(0, cursor.column), session.getTabString());
			this.moveCursorTo(cursor.row + 1, 0);
			var size = session.getTabSize();
			var minIndent = Number.MAX_VALUE;
			for(var row = cursor.row + 1; row <= end.row; ++row) {
				var indent = 0;
				line = session.getLine(row);
				for(var i = 0; i < line.length; ++i) {
					if(line.charAt(i) == "\t") {
						indent += size;
					} else if(line.charAt(i) == " ") {
						indent += 1;
					} else {
						break;
					}
				}
				if(/[^\s]/.test(line)) {
					minIndent = Math.min(indent, minIndent);
				}
			}
			for(var row = cursor.row + 1; row <= end.row; ++row) {
				var outdent = minIndent;
				line = session.getLine(row);
				for(var i = 0; i < line.length && outdent > 0; ++i) {
					if(line.charAt(i) == "\t") {
						outdent -= size;
					} else if(line.charAt(i) == " ") {
						outdent -= 1;
					}
				}
				session.remove(new Range(row, 0, row, i));
			}
			session.indentRows(cursor.row + 1, end.row, lineIndent);
		}
		if(shouldOutdent) {
			mode.autoOutdent(lineState, session, cursor.row);
		}
	},
	onTextInput : function(text) {
		this.keyBinding.onTextInput(text);
	},
	onCommandKey : function(e, hashId, keyCode) {
		this.keyBinding.onCommandKey(e, hashId, keyCode);
	},
	setOverwrite : function(overwrite) {
		this.session.setOverwrite(overwrite);
	},
	getOverwrite : function() {
		return this.session.getOverwrite();
	},
	toggleOverwrite : function() {
		this.session.toggleOverwrite();
	},
	setScrollSpeed : function(speed) {
		this.$mouseHandler.setScrollSpeed(speed);
	},
	getScrollSpeed : function() {
		return this.$mouseHandler.getScrollSpeed();
	},
	setDragDelay : function(dragDelay) {
		this.$mouseHandler.setDragDelay(dragDelay);
	},
	getDragDelay : function() {
		return this.$mouseHandler.getDragDelay();
	},
	$selectionStyle : "line",
	setSelectionStyle : function(style) {
		if(this.$selectionStyle == style) {
			return;
		}
		this.$selectionStyle = style;
		this.onSelectionChange();
		this._emit("changeSelectionStyle", {
			data : style
		});
	},
	getSelectionStyle : function() {
		return this.$selectionStyle;
	},
	$highlightActiveLine : true,
	setHighlightActiveLine : function(shouldHighlight) {
		if(this.$highlightActiveLine == shouldHighlight) {
			return;
		}
		this.$highlightActiveLine = shouldHighlight;
		this.$updateHighlightActiveLine();
	},
	getHighlightActiveLine : function() {
		return this.$highlightActiveLine;
	},
	$highlightGutterLine : true,
	setHighlightGutterLine : function(shouldHighlight) {
		if(this.$highlightGutterLine == shouldHighlight) {
			return;
		}
		this.renderer.setHighlightGutterLine(shouldHighlight);
		this.$highlightGutterLine = shouldHighlight;
	},
	getHighlightGutterLine : function() {
		return this.$highlightGutterLine;
	},
	$highlightSelectedWord : true,
	setHighlightSelectedWord : function(shouldHighlight) {
		if(this.$highlightSelectedWord == shouldHighlight) {
			return;
		}
		this.$highlightSelectedWord = shouldHighlight;
		this.$onSelectionChange();
	},
	getHighlightSelectedWord : function() {
		return this.$highlightSelectedWord;
	},
	setAnimatedScroll : function(shouldAnimate) {
		this.renderer.setAnimatedScroll(shouldAnimate);
	},
	getAnimatedScroll : function() {
		return this.renderer.getAnimatedScroll();
	},
	setShowInvisibles : function(showInvisibles) {
		this.renderer.setShowInvisibles(showInvisibles);
	},
	getShowInvisibles : function() {
		return this.renderer.getShowInvisibles();
	},
	setDisplayIndentGuides : function(display) {
		this.renderer.setDisplayIndentGuides(display);
	},
	getDisplayIndentGuides : function() {
		return this.renderer.getDisplayIndentGuides();
	},
	setShowPrintMargin : function(showPrintMargin) {
		this.renderer.setShowPrintMargin(showPrintMargin);
	},
	getShowPrintMargin : function() {
		return this.renderer.getShowPrintMargin();
	},
	setPrintMarginColumn : function(showPrintMargin) {
		this.renderer.setPrintMarginColumn(showPrintMargin);
	},
	getPrintMarginColumn : function() {
		return this.renderer.getPrintMarginColumn();
	},
	$readOnly : false,
	setReadOnly : function(readOnly) {
		this.$readOnly = readOnly;
	},
	getReadOnly : function() {
		return this.$readOnly;
	},
	$modeBehaviours : true,
	setBehavioursEnabled : function(enabled) {
		this.$modeBehaviours = enabled;
	},
	getBehavioursEnabled : function() {
		return this.$modeBehaviours;
	},
	setShowFoldWidgets : function(show) {
		var gutter = this.renderer.$gutterLayer;
		if(gutter.getShowFoldWidgets() == show) {
			return;
		}
		this.renderer.$gutterLayer.setShowFoldWidgets(show);
		this.$showFoldWidgets = show;
		this.renderer.updateFull();
	},
	getShowFoldWidgets : function() {
		return this.renderer.$gutterLayer.getShowFoldWidgets();
	},
	setFadeFoldWidgets : function(show) {
		this.renderer.setFadeFoldWidgets(show);
	},
	getFadeFoldWidgets : function() {
		return this.renderer.getFadeFoldWidgets();
	},
	remove : function(dir) {
		if(this.selection.isEmpty()) {
			if(dir == "left") {
				this.selection.selectLeft();
			} else {
				this.selection.selectRight();
			}
		}
		var range = this.getSelectionRange();
		if(this.getBehavioursEnabled()) {
			var session = this.session;
			var state = session.getState(range.start.row);
			var new_range = session.getMode().transformAction(state, "deletion", this, session, range);
			if(new_range) {
				range = new_range;
			}
		}
		this.session.remove(range);
		this.clearSelection();
	},
	removeWordRight : function() {
		if(this.selection.isEmpty()) {
			this.selection.selectWordRight();
		}
		this.session.remove(this.getSelectionRange());
		this.clearSelection();
	},
	removeWordLeft : function() {
		if(this.selection.isEmpty()) {
			this.selection.selectWordLeft();
		}
		this.session.remove(this.getSelectionRange());
		this.clearSelection();
	},
	removeToLineStart : function() {
		if(this.selection.isEmpty()) {
			this.selection.selectLineStart();
		}
		this.session.remove(this.getSelectionRange());
		this.clearSelection();
	},
	removeToLineEnd : function() {
		if(this.selection.isEmpty()) {
			this.selection.selectLineEnd();
		}
		var range = this.getSelectionRange();
		if(range.start.column == range.end.column && range.start.row == range.end.row) {
			range.end.column = 0;
			range.end.row++;
		}
		this.session.remove(range);
		this.clearSelection();
	},
	splitLine : function() {
		if(!this.selection.isEmpty()) {
			this.session.remove(this.getSelectionRange());
			this.clearSelection();
		}
		var cursor = this.getCursorPosition();
		this.insert("\n");
		this.moveCursorToPosition(cursor);
	},
	transposeLetters : function() {
		if(!this.selection.isEmpty()) {
			return;
		}
		var cursor = this.getCursorPosition();
		var column = cursor.column;
		if(column === 0) {
			return;
		}
		var line = this.session.getLine(cursor.row);
		var swap, range;
		if(column < line.length) {
			swap = line.charAt(column) + line.charAt(column - 1);
			range = new Range(cursor.row, column - 1, cursor.row, column + 1);
		} else {
			swap = line.charAt(column - 1) + line.charAt(column - 2);
			range = new Range(cursor.row, column - 2, cursor.row, column);
		}
		this.session.replace(range, swap);
	},
	toLowerCase : function() {
		var originalRange = this.getSelectionRange();
		if(this.selection.isEmpty()) {
			this.selection.selectWord();
		}
		var range = this.getSelectionRange();
		var text = this.session.getTextRange(range);
		this.session.replace(range, text.toLowerCase());
		this.selection.setSelectionRange(originalRange);
	},
	toUpperCase : function() {
		var originalRange = this.getSelectionRange();
		if(this.selection.isEmpty()) {
			this.selection.selectWord();
		}
		var range = this.getSelectionRange();
		var text = this.session.getTextRange(range);
		this.session.replace(range, text.toUpperCase());
		this.selection.setSelectionRange(originalRange);
	},
	indent : function() {
		var session = this.session;
		var range = this.getSelectionRange();
		if(range.start.row < range.end.row || range.start.column < range.end.column) {
			var rows = this.$getSelectedRows();
			session.indentRows(rows.first, rows.last, "\t");
		} else {
			var indentString;
			if(this.session.getUseSoftTabs()) {
				var size = session.getTabSize(), position = this.getCursorPosition(), column = session.documentToScreenColumn(position.row, position.column), count = size - column % size;
				indentString = lang.stringRepeat(" ", count);
			} else {
				indentString = "\t";
			}
			return this.insert(indentString);
		}
	},
	blockOutdent : function() {
		var selection = this.session.getSelection();
		this.session.outdentRows(selection.getRange());
	},
	sortLines : function() {
		var rows = this.$getSelectedRows();
		var session = this.session;
		var lines = [];
		for( i = rows.first; i <= rows.last; i++) {
			lines.push(session.getLine(i));
		}
		lines.sort(function(a, b) {
			if(a.toLowerCase() < b.toLowerCase()) {
				return -1;
			}
			if(a.toLowerCase() > b.toLowerCase()) {
				return 1;
			}
			return 0;
		});
		var deleteRange = new Range(0, 0, 0, 0);
		for(var i = rows.first; i <= rows.last; i++) {
			var line = session.getLine(i);
			deleteRange.start.row = i;
			deleteRange.end.row = i;
			deleteRange.end.column = line.length;
			session.replace(deleteRange, lines[i - rows.first]);
		}
	},
	toggleCommentLines : function() {
		var state = this.session.getState(this.getCursorPosition().row);
		var rows = this.$getSelectedRows();
		this.session.getMode().toggleCommentLines(state, this.session, rows.first, rows.last);
	},
	getNumberAt : function(row, column) {
		var _numberRx = /[\-]?[0-9]+(?:\.[0-9]+)?/g;
		_numberRx.lastIndex = 0;
		var s = this.session.getLine(row);
		while(_numberRx.lastIndex < column - 1) {
			var m = _numberRx.exec(s);
			if(m.index <= column && m.index + m[0].length >= column) {
				var number = {
					value : m[0],
					start : m.index,
					end : m.index + m[0].length
				};
				return number;
			}
		}
		return null;
	},
	modifyNumber : function(amount) {
		var row = this.selection.getCursor().row;
		var column = this.selection.getCursor().column;
		var charRange = new Range(row, column - 1, row, column);
		var c = this.session.getTextRange(charRange);
		if(!isNaN(parseFloat(c)) && isFinite(c)) {
			var nr = this.getNumberAt(row, column);
			if(nr) {
				var fp = nr.value.indexOf(".") >= 0 ? nr.start + nr.value.indexOf(".") + 1 : nr.end;
				var decimals = nr.start + nr.value.length - fp;
				var t = parseFloat(nr.value);
				t *= Math.pow(10, decimals);
				if(fp !== nr.end && column < fp) {
					amount *= Math.pow(10, nr.end - column - 1);
				} else {
					amount *= Math.pow(10, nr.end - column);
				}
				t += amount;
				t /= Math.pow(10, decimals);
				var nnr = t.toFixed(decimals);
				var replaceRange = new Range(row, nr.start, row, nr.end);
				this.session.replace(replaceRange, nnr);
				this.moveCursorTo(row, Math.max(nr.start + 1, column + nnr.length - nr.value.length));
			}
		}
	},
	removeLines : function() {
		var rows = this.$getSelectedRows();
		var range;
		if(rows.first === 0 || rows.last + 1 < this.session.getLength()) {
			range = new Range(rows.first, 0, rows.last + 1, 0);
		} else {
			range = new Range(rows.first - 1, this.session.getLine(rows.first - 1).length, rows.last, this.session.getLine(rows.last).length);
		}
		this.session.remove(range);
		this.clearSelection();
	},
	duplicateSelection : function() {
		var sel = this.selection;
		var doc = this.session;
		var range = sel.getRange();
		if(range.isEmpty()) {
			var row = range.start.row;
			doc.duplicateLines(row, row);
		} else {
			var reverse = sel.isBackwards();
			var point = sel.isBackwards() ? range.start : range.end;
			var endPoint = doc.insert(point, doc.getTextRange(range), false);
			range.start = point;
			range.end = endPoint;
			sel.setSelectionRange(range, reverse);
		}
	},
	moveLinesDown : function() {
		this.$moveLines(function(firstRow, lastRow) {
			return this.session.moveLinesDown(firstRow, lastRow);
		});
	},
	moveLinesUp : function() {
		this.$moveLines(function(firstRow, lastRow) {
			return this.session.moveLinesUp(firstRow, lastRow);
		});
	},
	moveText : function(range, toPosition) {
		if(this.$readOnly) {
			return null;
		}
		return this.session.moveText(range, toPosition);
	},
	copyLinesUp : function() {
		this.$moveLines(function(firstRow, lastRow) {
			this.session.duplicateLines(firstRow, lastRow);
			return 0;
		});
	},
	copyLinesDown : function() {
		this.$moveLines(function(firstRow, lastRow) {
			return this.session.duplicateLines(firstRow, lastRow);
		});
	},
	$moveLines : function(mover) {
		var rows = this.$getSelectedRows();
		var selection = this.selection;
		if(!selection.isMultiLine()) {
			var range = selection.getRange();
			var reverse = selection.isBackwards();
		}
		var linesMoved = mover.call(this, rows.first, rows.last);
		if(range) {
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
	$getSelectedRows : function() {
		var range = this.getSelectionRange().collapseRows();
		return {
			first : range.start.row,
			last : range.end.row
		};
	},
	onCompositionStart : function(text) {
		this.renderer.showComposition(this.getCursorPosition());
	},
	onCompositionUpdate : function(text) {
		this.renderer.setCompositionText(text);
	},
	onCompositionEnd : function() {
		this.renderer.hideComposition();
	},
	getFirstVisibleRow : function() {
		return this.renderer.getFirstVisibleRow();
	},
	getLastVisibleRow : function() {
		return this.renderer.getLastVisibleRow();
	},
	isRowVisible : function(row) {
		return row >= this.getFirstVisibleRow() && row <= this.getLastVisibleRow();
	},
	isRowFullyVisible : function(row) {
		return row >= this.renderer.getFirstFullyVisibleRow() && row <= this.renderer.getLastFullyVisibleRow();
	},
	$getVisibleRowCount : function() {
		return this.renderer.getScrollBottomRow() - this.renderer.getScrollTopRow() + 1;
	},
	$moveByPage : function(dir, select) {
		var renderer = this.renderer;
		var config = this.renderer.layerConfig;
		var rows = dir * Math.floor(config.height / config.lineHeight);
		this.$blockScrolling++;
		if(select == true) {
			this.selection.$moveSelection(function() {
				this.moveCursorBy(rows, 0);
			});
		} else if(select == false) {
			this.selection.moveCursorBy(rows, 0);
			this.selection.clearSelection();
		}
		this.$blockScrolling--;
		var scrollTop = renderer.scrollTop;
		renderer.scrollBy(0, rows * config.lineHeight);
		if(select != null) {
			renderer.scrollCursorIntoView(null, 0.5);
		}
		renderer.animateScrolling(scrollTop);
	},
	selectPageDown : function() {
		this.$moveByPage(1, true);
	},
	selectPageUp : function() {
		this.$moveByPage(-1, true);
	},
	gotoPageDown : function() {
		this.$moveByPage(1, false);
	},
	gotoPageUp : function() {
		this.$moveByPage(-1, false);
	},
	scrollPageDown : function() {
		this.$moveByPage(1);
	},
	scrollPageUp : function() {
		this.$moveByPage(-1);
	},
	scrollToRow : function(row) {
		this.renderer.scrollToRow(row);
	},
	scrollToLine : function(line, center, animate, callback) {
		this.renderer.scrollToLine(line, center, animate, callback);
	},
	centerSelection : function() {
		var range = this.getSelectionRange();
		var pos = {
			row : Math.floor(range.start.row + (range.end.row - range.start.row) / 2),
			column : Math.floor(range.start.column + (range.end.column - range.start.column) / 2)
		};
		this.renderer.alignCursor(pos, 0.5);
	},
	getCursorPosition : function() {
		return this.selection.getCursor();
	},
	getCursorPositionScreen : function() {
		return this.session.documentToScreenPosition(this.getCursorPosition());
	},
	getSelectionRange : function() {
		return this.selection.getRange();
	},
	selectAll : function() {
		this.$blockScrolling += 1;
		this.selection.selectAll();
		this.$blockScrolling -= 1;
	},
	clearSelection : function() {
		this.selection.clearSelection();
	},
	moveCursorTo : function(row, column) {
		this.selection.moveCursorTo(row, column);
	},
	moveCursorToPosition : function(pos) {
		this.selection.moveCursorToPosition(pos);
	},
	jumpToMatching : function(select) {
		var cursor = this.getCursorPosition();
		var range = this.session.getBracketRange(cursor);
		if(!range) {
			range = this.find({
				needle : /[{}()\[\]]/g,
				preventScroll : true,
				start : {
					row : cursor.row,
					column : cursor.column - 1
				}
			});
			if(!range) {
				return;
			}
			var pos = range.start;
			if(pos.row == cursor.row && Math.abs(pos.column - cursor.column) < 2) {
				range = this.session.getBracketRange(pos);
			}
		}
		pos = range && range.cursor || pos;
		if(pos) {
			if(select) {
				if(range && range.isEqual(this.getSelectionRange())) {
					this.clearSelection();
				} else {
					this.selection.selectTo(pos.row, pos.column);
				}
			} else {
				this.clearSelection();
				this.moveCursorTo(pos.row, pos.column);
			}
		}
	},
	gotoLine : function(lineNumber, column, animate) {
		this.selection.clearSelection();
		this.session.unfold({
			row : lineNumber - 1,
			column : column || 0
		});
		this.$blockScrolling += 1;
		this.moveCursorTo(lineNumber - 1, column || 0);
		this.$blockScrolling -= 1;
		if(!this.isRowFullyVisible(lineNumber - 1)) {
			this.scrollToLine(lineNumber - 1, true, animate);
		}
	},
	navigateTo : function(row, column) {
		this.clearSelection();
		this.moveCursorTo(row, column);
	},
	navigateUp : function(times) {
		this.selection.clearSelection();
		times = times || 1;
		this.selection.moveCursorBy(-times, 0);
	},
	navigateDown : function(times) {
		this.selection.clearSelection();
		times = times || 1;
		this.selection.moveCursorBy(times, 0);
	},
	navigateLeft : function(times) {
		if(!this.selection.isEmpty()) {
			var selectionStart = this.getSelectionRange().start;
			this.moveCursorToPosition(selectionStart);
		} else {
			times = times || 1;
			while(times--) {
				this.selection.moveCursorLeft();
			}
		}
		this.clearSelection();
	},
	navigateRight : function(times) {
		if(!this.selection.isEmpty()) {
			var selectionEnd = this.getSelectionRange().end;
			this.moveCursorToPosition(selectionEnd);
		} else {
			times = times || 1;
			while(times--) {
				this.selection.moveCursorRight();
			}
		}
		this.clearSelection();
	},
	navigateLineStart : function() {
		this.selection.moveCursorLineStart();
		this.clearSelection();
	},
	navigateLineEnd : function() {
		this.selection.moveCursorLineEnd();
		this.clearSelection();
	},
	navigateFileEnd : function() {
		var scrollTop = this.renderer.scrollTop;
		this.selection.moveCursorFileEnd();
		this.clearSelection();
		this.renderer.animateScrolling(scrollTop);
	},
	navigateFileStart : function() {
		var scrollTop = this.renderer.scrollTop;
		this.selection.moveCursorFileStart();
		this.clearSelection();
		this.renderer.animateScrolling(scrollTop);
	},
	navigateWordRight : function() {
		this.selection.moveCursorWordRight();
		this.clearSelection();
	},
	navigateWordLeft : function() {
		this.selection.moveCursorWordLeft();
		this.clearSelection();
	},
	replace : function(replacement, options) {
		if(options) {
			this.$search.set(options);
		}
		var range = this.$search.find(this.session);
		var replaced = 0;
		if(!range) {
			return replaced;
		}
		if(this.$tryReplace(range, replacement)) {
			replaced = 1;
		}
		if(range !== null) {
			this.selection.setSelectionRange(range);
			this.renderer.scrollSelectionIntoView(range.start, range.end);
		}
		return replaced;
	},
	replaceAll : function(replacement, options) {
		if(options) {
			this.$search.set(options);
		}
		var ranges = this.$search.findAll(this.session);
		var replaced = 0;
		if(!ranges.length) {
			return replaced;
		}
		this.$blockScrolling += 1;
		var selection = this.getSelectionRange();
		this.clearSelection();
		this.selection.moveCursorTo(0, 0);
		for(var i = ranges.length - 1; i >= 0; --i) {
			if(this.$tryReplace(ranges[i], replacement)) {
				replaced++;
			}
		}
		this.selection.setSelectionRange(selection);
		this.$blockScrolling -= 1;
		return replaced;
	},
	$tryReplace : function(range, replacement) {
		var input = this.session.getTextRange(range);
		replacement = this.$search.replace(input, replacement);
		if(replacement !== null) {
			range.end = this.session.replace(range, replacement);
			return range;
		} else {
			return null;
		}
	},
	getLastSearchOptions : function() {
		return this.$search.getOptions();
	},
	find : function(needle, options, animate) {
		if(!options) {
			options = {};
		}
		if( typeof needle == "string" || needle instanceof RegExp) {
			options.needle = needle;
		} else if( typeof needle == "object") {
			oop.mixin(options, needle);
		}
		var range = this.selection.getRange();
		if(options.needle == null) {
			needle = this.session.getTextRange(range) || this.$search.$options.needle;
			if(!needle) {
				range = this.session.getWordRange(range.start.row, range.start.column);
				needle = this.session.getTextRange(range);
			}
			this.$search.set({
				needle : needle
			});
		}
		this.$search.set(options);
		if(!options.start) {
			this.$search.set({
				start : range
			});
		}
		var newRange = this.$search.find(this.session);
		if(options.preventScroll) {
			return newRange;
		}
		if(newRange) {
			this.revealRange(newRange, animate);
			return newRange;
		}
		if(options.backwards) {
			range.start = range.end;
		} else {
			range.end = range.start;
		}
		this.selection.setRange(range);
	},
	findNext : function(options, animate) {
		this.find({
			skipCurrent : true,
			backwards : false
		}, options, animate);
	},
	findPrevious : function(options, animate) {
		this.find(options, {
			skipCurrent : true,
			backwards : true
		}, animate);
	},
	revealRange : function(range, animate) {
		this.$blockScrolling += 1;
		this.session.unfold(range);
		this.selection.setSelectionRange(range);
		this.$blockScrolling -= 1;
		var scrollTop = this.renderer.scrollTop;
		this.renderer.scrollSelectionIntoView(range.start, range.end, 0.5);
		if(animate != false) {
			this.renderer.animateScrolling(scrollTop);
		}
	},
	undo : function() {
		this.$blockScrolling++;
		this.session.getUndoManager().undo();
		this.$blockScrolling--;
		this.renderer.scrollCursorIntoView(null, 0.5);
	},
	redo : function() {
		this.$blockScrolling++;
		this.session.getUndoManager().redo();
		this.$blockScrolling--;
		this.renderer.scrollCursorIntoView(null, 0.5);
	},
	destroy : function() {
		this.renderer.destroy();
	},
	setDocument : function(doc) {
		if(this.doc) {
			this.doc.removeListener("change", this.$onChange);
		}
		this.doc = doc;
		doc.on("change", this.$onChange);
		if(this.bgTokenizer) {
			this.bgTokenizer.setDocument(this.getDocument());
		}
		this.resetCaches();
	},
	getDocument : function() {
		return this.doc;
	},
	$resetRowCache : function(docRow) {
		if(!docRow) {
			this.$docRowCache = [];
			this.$screenRowCache = [];
			return;
		}
		var i = this.$getRowCacheIndex(this.$docRowCache, docRow) + 1;
		var l = this.$docRowCache.length;
		this.$docRowCache.splice(i, l);
		this.$screenRowCache.splice(i, l);
	},
	$getRowCacheIndex : function(cacheArray, val) {
		var low = 0;
		var hi = cacheArray.length - 1;
		while(low <= hi) {
			var mid = low + hi >> 1;
			var c = cacheArray[mid];
			if(val > c) {
				low = mid + 1;
			} else if(val < c) {
				hi = mid - 1;
			} else {
				return mid;
			}
		}
		return low && low - 1;
	},
	resetCaches : function() {
		this.$modified = true;
		this.$wrapData = [];
		this.$rowLengthCache = [];
		this.$resetRowCache(0);
		if(this.bgTokenizer) {
			this.bgTokenizer.start(0);
		}
	},
	onChangeFold : function(e) {
		var fold = e.data;
		this.$resetRowCache(fold.start.row);
	},
	onChange : function(e) {
		var delta = e.data;
		this.$modified = true;
		this.$resetRowCache(delta.range.start.row);
		var removedFolds = this.$updateInternalDataOnChange(e);
		if(!this.$fromUndo && this.$undoManager && !delta.ignore) {
			this.$deltasDoc.push(delta);
			if(removedFolds && removedFolds.length != 0) {
				this.$deltasFold.push({
					action : "removeFolds",
					folds : removedFolds
				});
			}
			this.$informUndoManager.schedule();
		}
		this.bgTokenizer.$updateOnChange(delta);
		this._emit("change", e);
	},
	setValue : function(text) {
		this.doc.setValue(text);
		this.selection.moveCursorTo(0, 0);
		this.selection.clearSelection();
		this.$resetRowCache(0);
		this.$deltas = [];
		this.$deltasDoc = [];
		this.$deltasFold = [];
		this.getUndoManager().reset();
	},
	toString : function() {
		return this.doc.getValue();
	},
	getValue : function() {
		return this.doc.getValue();
	},
	getSelection : function() {
		return this.selection;
	},
	getState : function(row) {
		return this.bgTokenizer.getState(row);
	},
	getTokens : function(row) {
		return this.bgTokenizer.getTokens(row);
	},
	getTokenAt : function(row, column) {
		var tokens = this.bgTokenizer.getTokens(row);
		var token, c = 0;
		if(column == null) {
			i = tokens.length - 1;
			c = this.getLine(row).length;
		} else {
			for(var i = 0; i < tokens.length; i++) {
				c += tokens[i].value.length;
				if(c >= column) {
					break;
				}
			}
		}
		token = tokens[i];
		if(!token) {
			return null;
		}
		token.index = i;
		token.start = c - token.value.length;
		return token;
	},
	setUndoManager : function(undoManager) {
		this.$undoManager = undoManager;
		this.$deltas = [];
		this.$deltasDoc = [];
		this.$deltasFold = [];
		if(this.$informUndoManager) {
			this.$informUndoManager.cancel();
		}
		if(undoManager) {
			var self = this;
			this.$syncInformUndoManager = function() {
				self.$informUndoManager.cancel();
				if(self.$deltasFold.length) {
					self.$deltas.push({
						group : "fold",
						deltas : self.$deltasFold
					});
					self.$deltasFold = [];
				}
				if(self.$deltasDoc.length) {
					self.$deltas.push({
						group : "doc",
						deltas : self.$deltasDoc
					});
					self.$deltasDoc = [];
				}
				if(self.$deltas.length > 0) {
					undoManager.execute({
						action : "aceupdate",
						args : [self.$deltas, self]
					});
				}
				self.$deltas = [];
			};
			this.$informUndoManager = lang.deferredCall(this.$syncInformUndoManager);
		}
	},
	$defaultUndoManager : {
		undo : function() {
		},
		redo : function() {
		},
		reset : function() {
		}
	},
	getUndoManager : function() {
		return this.$undoManager || this.$defaultUndoManager;
	},
	getTabString : function() {
		if(this.getUseSoftTabs()) {
			return lang.stringRepeat(" ", this.getTabSize());
		} else {
			return "\t";
		}
	},
	$useSoftTabs : true,
	setUseSoftTabs : function(useSoftTabs) {
		if(this.$useSoftTabs === useSoftTabs) {
			return;
		}
		this.$useSoftTabs = useSoftTabs;
	},
	getUseSoftTabs : function() {
		return this.$useSoftTabs;
	},
	$tabSize : 4,
	setTabSize : function(tabSize) {
		if(isNaN(tabSize) || this.$tabSize === tabSize) {
			return;
		}
		this.$modified = true;
		this.$rowLengthCache = [];
		this.$tabSize = tabSize;
		this._emit("changeTabSize");
	},
	getTabSize : function() {
		return this.$tabSize;
	},
	isTabStop : function(position) {
		return this.$useSoftTabs && position.column % this.$tabSize == 0;
	},
	$overwrite : false,
	setOverwrite : function(overwrite) {
		if(this.$overwrite == overwrite) {
			return;
		}
		this.$overwrite = overwrite;
		this._emit("changeOverwrite");
	},
	getOverwrite : function() {
		return this.$overwrite;
	},
	toggleOverwrite : function() {
		this.setOverwrite(!this.$overwrite);
	},
	addGutterDecoration : function(row, className) {
		if(!this.$decorations[row]) {
			this.$decorations[row] = "";
		}
		this.$decorations[row] += " " + className;
		this._emit("changeBreakpoint", {});
	},
	removeGutterDecoration : function(row, className) {
		this.$decorations[row] = (this.$decorations[row] || "").replace(" " + className, "");
		this._emit("changeBreakpoint", {});
	},
	getBreakpoints : function() {
		return this.$breakpoints;
	},
	setBreakpoints : function(rows) {
		this.$breakpoints = [];
		for(var i = 0; i < rows.length; i++) {
			this.$breakpoints[rows[i]] = "ace_breakpoint";
		}
		this._emit("changeBreakpoint", {});
	},
	clearBreakpoints : function() {
		this.$breakpoints = [];
		this._emit("changeBreakpoint", {});
	},
	setBreakpoint : function(row, className) {
		if(className === undefined) {
			className = "ace_breakpoint";
		}
		if(className) {
			this.$breakpoints[row] = className;
		} else {
			delete this.$breakpoints[row];
		}
		this._emit("changeBreakpoint", {});
	},
	clearBreakpoint : function(row) {
		delete this.$breakpoints[row];
		this._emit("changeBreakpoint", {});
	},
	addMarker : function(range, clazz, type, inFront) {
		var id = this.$markerId++;
		var marker = {
			range : range,
			type : type || "line",
			renderer : typeof type == "function" ? type : null,
			clazz : clazz,
			inFront : !!inFront,
			id : id
		};
		if(inFront) {
			this.$frontMarkers[id] = marker;
			this._emit("changeFrontMarker");
		} else {
			this.$backMarkers[id] = marker;
			this._emit("changeBackMarker");
		}
		return id;
	},
	addDynamicMarker : function(marker, inFront) {
		if(!marker.update) {
			return;
		}
		var id = this.$markerId++;
		marker.id = id;
		marker.inFront = !!inFront;
		if(inFront) {
			this.$frontMarkers[id] = marker;
			this._emit("changeFrontMarker");
		} else {
			this.$backMarkers[id] = marker;
			this._emit("changeBackMarker");
		}
		return marker;
	},
	removeMarker : function(markerId) {
		var marker = this.$frontMarkers[markerId] || this.$backMarkers[markerId];
		if(!marker) {
			return;
		}
		var markers = marker.inFront ? this.$frontMarkers : this.$backMarkers;
		if(marker) {
			delete markers[markerId];
			this._emit(marker.inFront ? "changeFrontMarker" : "changeBackMarker");
		}
	},
	getMarkers : function(inFront) {
		return inFront ? this.$frontMarkers : this.$backMarkers;
	},
	highlight : function(re) {
		if(!this.$searchHighlight) {
			var highlight = new SearchHighlight(null, "ace_selected-word", "text");
			this.$searchHighlight = this.addDynamicMarker(highlight);
		}
		this.$searchHighlight.setRegexp(re);
	},
	highlightLines : function(startRow, endRow, clazz, inFront) {
		if( typeof endRow != "number") {
			clazz = endRow;
			endRow = startRow;
		}
		if(!clazz) {
			clazz = "ace_step";
		}
		var range = new Range(startRow, 0, endRow, Infinity);
		var id = this.addMarker(range, clazz, "fullLine", inFront);
		range.id = id;
		return range;
	},
	setAnnotations : function(annotations) {
		this.$annotations = annotations;
		this._emit("changeAnnotation", {});
	},
	getAnnotations : function() {
		return this.$annotations || [];
	},
	clearAnnotations : function() {
		this.$annotations = {};
		this._emit("changeAnnotation", {});
	},
	$detectNewLine : function(text) {
		var match = text.match(/^.*?(\r?\n)/m);
		if(match) {
			this.$autoNewLine = match[1];
		} else {
			this.$autoNewLine = "\n";
		}
	},
	getWordRange : function(row, column) {
		var line = this.getLine(row);
		var inToken = false;
		if(column > 0) {
			inToken = !!line.charAt(column - 1).match(this.tokenRe);
		}
		if(!inToken) {
			inToken = !!line.charAt(column).match(this.tokenRe);
		}
		if(inToken) {
			var re = this.tokenRe;
		} else if(/^\s+$/.test(line.slice(column - 1, column + 1))) {
			var re = /\s/;
		} else {
			var re = this.nonTokenRe;
		}
		var start = column;
		if(start > 0) {
			do {
				start--;
			} while (start >= 0 && line.charAt(start).match(re));
			start++;
		}
		var end = column;
		while(end < line.length && line.charAt(end).match(re)) {
			end++;
		}
		return new Range(row, start, row, end);
	},
	getAWordRange : function(row, column) {
		var wordRange = this.getWordRange(row, column);
		var line = this.getLine(wordRange.end.row);
		while(line.charAt(wordRange.end.column).match(/[ \t]/)) {
			wordRange.end.column += 1;
		}
		return wordRange;
	},
	setNewLineMode : function(newLineMode) {
		this.doc.setNewLineMode(newLineMode);
	},
	getNewLineMode : function() {
		return this.doc.getNewLineMode();
	},
	$useWorker : true,
	setUseWorker : function(useWorker) {
		if(this.$useWorker == useWorker) {
			return;
		}
		this.$useWorker = useWorker;
		this.$stopWorker();
		if(useWorker) {
			this.$startWorker();
		}
	},
	getUseWorker : function() {
		return this.$useWorker;
	},
	onReloadTokenizer : function(e) {
		var rows = e.data;
		this.bgTokenizer.start(rows.first);
		this._emit("tokenizerUpdate", e);
	},
	$modes : {},
	_loadMode : function(mode, callback) {
		if(!this.$modes["null"]) {
			this.$modes["null"] = this.$modes['ace/mode/text'] = new TextMode;
		}
		if(this.$modes[mode]) {
			return callback(this.$modes[mode]);
		}
		var _self = this;
		var module;
		try {
			module = require(mode);
		} catch (e) {
		}
		if(module && module.Mode) {
			return done(module);
		}
		if(!this.$mode) {
			this.$setModePlaceholder();
		}
		fetch(mode, function() {
			require([mode], done);
		});
		function done(module) {
			if(_self.$modes[mode]) {
				return callback(_self.$modes[mode]);
			}
			_self.$modes[mode] = new module.Mode;
			_self.$modes[mode].$id = mode;
			_self._emit("loadmode", {
				name : mode,
				mode : _self.$modes[mode]
			});
			callback(_self.$modes[mode]);
		}

		function fetch(name, callback) {
			if(!config.get("packaged")) {
				return callback();
			}
			net.loadScript(config.moduleUrl(name, "mode"), callback);
		}

	},
	$setModePlaceholder : function() {
		this.$mode = this.$modes["null"];
		var tokenizer = this.$mode.getTokenizer();
		if(!this.bgTokenizer) {
			this.bgTokenizer = new BackgroundTokenizer(tokenizer);
			var _self = this;
			this.bgTokenizer.addEventListener("update", function(e) {
				_self._emit("tokenizerUpdate", e);
			});
		} else {
			this.bgTokenizer.setTokenizer(tokenizer);
		}
		this.bgTokenizer.setDocument(this.getDocument());
		this.tokenRe = this.$mode.tokenRe;
		this.nonTokenRe = this.$mode.nonTokenRe;
	},
	$mode : null,
	$modeId : null,
	setMode : function(mode) {
		mode = mode || "null";
		if( typeof mode === "string") {
			if(this.$modeId == mode) {
				return;
			}
			this.$modeId = mode;
			var _self = this;
			this._loadMode(mode, function(module) {
				if(_self.$modeId !== mode) {
					return;
				}
				_self.setMode(module);
			});
			return;
		}
		if(this.$mode === mode) {
			return;
		}
		this.$mode = mode;
		this.$modeId = mode.$id;
		this.$stopWorker();
		if(this.$useWorker) {
			this.$startWorker();
		}
		var tokenizer = mode.getTokenizer();
		if(tokenizer.addEventListener !== undefined) {
			var onReloadTokenizer = this.onReloadTokenizer.bind(this);
			tokenizer.addEventListener("update", onReloadTokenizer);
		}
		if(!this.bgTokenizer) {
			this.bgTokenizer = new BackgroundTokenizer(tokenizer);
			var _self = this;
			this.bgTokenizer.addEventListener("update", function(e) {
				_self._emit("tokenizerUpdate", e);
			});
		} else {
			this.bgTokenizer.setTokenizer(tokenizer);
		}
		this.bgTokenizer.setDocument(this.getDocument());
		this.bgTokenizer.start(0);
		this.tokenRe = mode.tokenRe;
		this.nonTokenRe = mode.nonTokenRe;
		this.$setFolding(mode.foldingRules);
		this._emit("changeMode");
	},
	$stopWorker : function() {
		if(this.$worker) {
			this.$worker.terminate();
		}
		this.$worker = null;
	},
	$startWorker : function() {
		if( typeof Worker !== "undefined" && !require.noWorker) {
			try {
				this.$worker = this.$mode.createWorker(this);
			} catch (e) {
				console.log("Could not load worker");
				console.log(e);
				this.$worker = null;
			}
		} else {
			this.$worker = null;
		}
	},
	getMode : function() {
		return this.$mode;
	},
	$scrollTop : 0,
	setScrollTop : function(scrollTop) {
		scrollTop = Math.round(Math.max(0, scrollTop));
		if(this.$scrollTop === scrollTop) {
			return;
		}
		this.$scrollTop = scrollTop;
		this._emit("changeScrollTop", scrollTop);
	},
	getScrollTop : function() {
		return this.$scrollTop;
	},
	$scrollLeft : 0,
	setScrollLeft : function(scrollLeft) {
		scrollLeft = Math.round(Math.max(0, scrollLeft));
		if(this.$scrollLeft === scrollLeft) {
			return;
		}
		this.$scrollLeft = scrollLeft;
		this._emit("changeScrollLeft", scrollLeft);
	},
	getScrollLeft : function() {
		return this.$scrollLeft;
	},
	getScreenWidth : function() {
		this.$computeWidth();
		return this.screenWidth;
	},
	$computeWidth : function(force) {
		if(this.$modified || force) {
			this.$modified = false;
			if(this.$useWrapMode) {
				return this.screenWidth = this.$wrapLimit;
			}
			var lines = this.doc.getAllLines();
			var cache = this.$rowLengthCache;
			var longestScreenLine = 0;
			var foldIndex = 0;
			var foldLine = this.$foldData[foldIndex];
			var foldStart = foldLine ? foldLine.start.row : Infinity;
			var len = lines.length;
			for(var i = 0; i < len; i++) {
				if(i > foldStart) {
					i = foldLine.end.row + 1;
					if(i >= len) {
						break;
					}
					foldLine = this.$foldData[foldIndex++];
					foldStart = foldLine ? foldLine.start.row : Infinity;
				}
				if(cache[i] == null) {
					cache[i] = this.$getStringScreenWidth(lines[i])[0];
				}
				if(cache[i] > longestScreenLine) {
					longestScreenLine = cache[i];
				}
			}
			this.screenWidth = longestScreenLine;
		}
	},
	getLine : function(row) {
		return this.doc.getLine(row);
	},
	getLines : function(firstRow, lastRow) {
		return this.doc.getLines(firstRow, lastRow);
	},
	getLength : function() {
		return this.doc.getLength();
	},
	getTextRange : function(range) {
		return this.doc.getTextRange(range || this.selection.getRange());
	},
	insert : function(position, text) {
		return this.doc.insert(position, text);
	},
	remove : function(range) {
		return this.doc.remove(range);
	},
	undoChanges : function(deltas, dontSelect) {
		if(!deltas.length) {
			return;
		}
		this.$fromUndo = true;
		var lastUndoRange = null;
		for(var i = deltas.length - 1; i != -1; i--) {
			var delta = deltas[i];
			if(delta.group == "doc") {
				this.doc.revertDeltas(delta.deltas);
				lastUndoRange = this.$getUndoSelection(delta.deltas, true, lastUndoRange);
			} else {
				delta.deltas.forEach(function(foldDelta) {
					this.addFolds(foldDelta.folds);
				}, this);
			}
		}
		this.$fromUndo = false; lastUndoRange && this.$undoSelect && !dontSelect && this.selection.setSelectionRange(lastUndoRange);
		return lastUndoRange;
	},
	redoChanges : function(deltas, dontSelect) {
		if(!deltas.length) {
			return;
		}
		this.$fromUndo = true;
		var lastUndoRange = null;
		for(var i = 0; i < deltas.length; i++) {
			var delta = deltas[i];
			if(delta.group == "doc") {
				this.doc.applyDeltas(delta.deltas);
				lastUndoRange = this.$getUndoSelection(delta.deltas, false, lastUndoRange);
			}
		}
		this.$fromUndo = false; lastUndoRange && this.$undoSelect && !dontSelect && this.selection.setSelectionRange(lastUndoRange);
		return lastUndoRange;
	},
	setUndoSelect : function(enable) {
		this.$undoSelect = enable;
	},
	$getUndoSelection : function(deltas, isUndo, lastUndoRange) {

		function isInsert(delta) {
			var insert = delta.action == "insertText" || delta.action == "insertLines";
			return isUndo ? !insert : insert;
		}

		var delta = deltas[0];
		var range, point;
		var lastDeltaIsInsert = false;
		if(isInsert(delta)) {
			range = delta.range.clone();
			lastDeltaIsInsert = true;
		} else {
			range = Range.fromPoints(delta.range.start, delta.range.start);
			lastDeltaIsInsert = false;
		}
		for(var i = 1; i < deltas.length; i++) {
			delta = deltas[i];
			if(isInsert(delta)) {
				point = delta.range.start;
				if(range.compare(point.row, point.column) == -1) {
					range.setStart(delta.range.start);
				}
				point = delta.range.end;
				if(range.compare(point.row, point.column) == 1) {
					range.setEnd(delta.range.end);
				}
				lastDeltaIsInsert = true;
			} else {
				point = delta.range.start;
				if(range.compare(point.row, point.column) == -1) {
					range = Range.fromPoints(delta.range.start, delta.range.start);
				}
				lastDeltaIsInsert = false;
			}
		}
		if(lastUndoRange != null) {
			var cmp = lastUndoRange.compareRange(range);
			if(cmp == 1) {
				range.setStart(lastUndoRange.start);
			} else if(cmp == -1) {
				range.setEnd(lastUndoRange.end);
			}
		}
		return range;
	},
	replace : function(range, text) {
		return this.doc.replace(range, text);
	},
	moveText : function(fromRange, toPosition) {
		var text = this.getTextRange(fromRange);
		this.remove(fromRange);
		var toRow = toPosition.row;
		var toColumn = toPosition.column;
		if(!fromRange.isMultiLine() && fromRange.start.row == toRow && fromRange.end.column < toColumn) {
			toColumn -= text.length;
		}
		if(fromRange.isMultiLine() && fromRange.end.row < toRow) {
			var lines = this.doc.$split(text);
			toRow -= lines.length - 1;
		}
		var endRow = toRow + fromRange.end.row - fromRange.start.row;
		var endColumn = fromRange.isMultiLine() ? fromRange.end.column : toColumn + fromRange.end.column - fromRange.start.column;
		var toRange = new Range(toRow, toColumn, endRow, endColumn);
		this.insert(toRange.start, text);
		return toRange;
	},
	indentRows : function(startRow, endRow, indentString) {
		indentString = indentString.replace(/\t/g, this.getTabString());
		for(var row = startRow; row <= endRow; row++) {
			this.insert({
				row : row,
				column : 0
			}, indentString);
		}
	},
	outdentRows : function(range) {
		var rowRange = range.collapseRows();
		var deleteRange = new Range(0, 0, 0, 0);
		var size = this.getTabSize();
		for(var i = rowRange.start.row; i <= rowRange.end.row; ++i) {
			var line = this.getLine(i);
			deleteRange.start.row = i;
			deleteRange.end.row = i;
			for(var j = 0; j < size; ++j) {
				if(line.charAt(j) != " ") {
					break;
				}
			}
			if(j < size && line.charAt(j) == "\t") {
				deleteRange.start.column = j;
				deleteRange.end.column = j + 1;
			} else {
				deleteRange.start.column = 0;
				deleteRange.end.column = j;
			}
			this.remove(deleteRange);
		}
	},
	moveLinesUp : function(firstRow, lastRow) {
		if(firstRow <= 0) {
			return 0;
		}
		var removed = this.doc.removeLines(firstRow, lastRow);
		this.doc.insertLines(firstRow - 1, removed);
		return -1;
	},
	moveLinesDown : function(firstRow, lastRow) {
		if(lastRow >= this.doc.getLength() - 1) {
			return 0;
		}
		var removed = this.doc.removeLines(firstRow, lastRow);
		this.doc.insertLines(firstRow + 1, removed);
		return 1;
	},
	duplicateLines : function(firstRow, lastRow) {
		var firstRow = this.$clipRowToDocument(firstRow);
		var lastRow = this.$clipRowToDocument(lastRow);
		var lines = this.getLines(firstRow, lastRow);
		this.doc.insertLines(firstRow, lines);
		var addedRows = lastRow - firstRow + 1;
		return addedRows;
	},
	$clipRowToDocument : function(row) {
		return Math.max(0, Math.min(row, this.doc.getLength() - 1));
	},
	$clipColumnToRow : function(row, column) {
		if(column < 0) {
			return 0;
		}
		return Math.min(this.doc.getLine(row).length, column);
	},
	$clipPositionToDocument : function(row, column) {
		column = Math.max(0, column);
		if(row < 0) {
			row = 0;
			column = 0;
		} else {
			var len = this.doc.getLength();
			if(row >= len) {
				row = len - 1;
				column = this.doc.getLine(len - 1).length;
			} else {
				column = Math.min(this.doc.getLine(row).length, column);
			}
		}
		return {
			row : row,
			column : column
		};
	},
	$clipRangeToDocument : function(range) {
		if(range.start.row < 0) {
			range.start.row = 0;
			range.start.column = 0;
		} else {
			range.start.column = this.$clipColumnToRow(range.start.row, range.start.column);
		}
		var len = this.doc.getLength() - 1;
		if(range.end.row > len) {
			range.end.row = len;
			range.end.column = this.doc.getLine(len).length;
		} else {
			range.end.column = this.$clipColumnToRow(range.end.row, range.end.column);
		}
		return range;
	},
	$wrapLimit : 80,
	$useWrapMode : false,
	$wrapLimitRange : {
		min : null,
		max : null
	},
	setUseWrapMode : function(useWrapMode) {
		if(useWrapMode != this.$useWrapMode) {
			this.$useWrapMode = useWrapMode;
			this.$modified = true;
			this.$resetRowCache(0);
			if(useWrapMode) {
				var len = this.getLength();
				this.$wrapData = [];
				for(var i = 0; i < len; i++) {
					this.$wrapData.push([]);
				}
				this.$updateWrapData(0, len - 1);
			}
			this._emit("changeWrapMode");
		}
	},
	getUseWrapMode : function() {
		return this.$useWrapMode;
	},
	setWrapLimitRange : function(min, max) {
		if(this.$wrapLimitRange.min !== min || this.$wrapLimitRange.max !== max) {
			this.$wrapLimitRange.min = min;
			this.$wrapLimitRange.max = max;
			this.$modified = true;
			this._emit("changeWrapMode");
		}
	},
	adjustWrapLimit : function(desiredLimit) {
		var wrapLimit = this.$constrainWrapLimit(desiredLimit);
		if(wrapLimit != this.$wrapLimit && wrapLimit > 0) {
			this.$wrapLimit = wrapLimit;
			this.$modified = true;
			if(this.$useWrapMode) {
				this.$updateWrapData(0, this.getLength() - 1);
				this.$resetRowCache(0);
				this._emit("changeWrapLimit");
			}
			return true;
		}
		return false;
	},
	$constrainWrapLimit : function(wrapLimit) {
		var min = this.$wrapLimitRange.min;
		if(min) {
			wrapLimit = Math.max(min, wrapLimit);
		}
		var max = this.$wrapLimitRange.max;
		if(max) {
			wrapLimit = Math.min(max, wrapLimit);
		}
		return Math.max(1, wrapLimit);
	},
	getWrapLimit : function() {
		return this.$wrapLimit;
	},
	getWrapLimitRange : function() {
		return {
			min : this.$wrapLimitRange.min,
			max : this.$wrapLimitRange.max
		};
	},
	$updateInternalDataOnChange : function(e) {
		var useWrapMode = this.$useWrapMode;
		var len;
		var action = e.data.action;
		var firstRow = e.data.range.start.row;
		var lastRow = e.data.range.end.row;
		var start = e.data.range.start;
		var end = e.data.range.end;
		var removedFolds = null;
		if(action.indexOf("Lines") != -1) {
			if(action == "insertLines") {
				lastRow = firstRow + e.data.lines.length;
			} else {
				lastRow = firstRow;
			}
			len = e.data.lines ? e.data.lines.length : lastRow - firstRow;
		} else {
			len = lastRow - firstRow;
		}
		if(len != 0) {
			if(action.indexOf("remove") != -1) {
				this[ useWrapMode ? "$wrapData" : "$rowLengthCache"].splice(firstRow, len);
				var foldLines = this.$foldData;
				removedFolds = this.getFoldsInRange(e.data.range);
				this.removeFolds(removedFolds);
				var foldLine = this.getFoldLine(end.row);
				var idx = 0;
				if(foldLine) {
					foldLine.addRemoveChars(end.row, end.column, start.column - end.column);
					foldLine.shiftRow(-len);
					var foldLineBefore = this.getFoldLine(firstRow);
					if(foldLineBefore && foldLineBefore !== foldLine) {
						foldLineBefore.merge(foldLine);
						foldLine = foldLineBefore;
					}
					idx = foldLines.indexOf(foldLine) + 1;
				}
				for(idx; idx < foldLines.length; idx++) {
					var foldLine = foldLines[idx];
					if(foldLine.start.row >= end.row) {
						foldLine.shiftRow(-len);
					}
				}
				lastRow = firstRow;
			} else {
				var args;
				if(useWrapMode) {
					args = [firstRow, 0];
					for(var i = 0; i < len; i++) {
						args.push([]);
					}
					this.$wrapData.splice.apply(this.$wrapData, args);
				} else {
					args = Array(len);
					args.unshift(firstRow, 0);
					this.$rowLengthCache.splice.apply(this.$rowLengthCache, args);
				}
				var foldLines = this.$foldData;
				var foldLine = this.getFoldLine(firstRow);
				var idx = 0;
				if(foldLine) {
					var cmp = foldLine.range.compareInside(start.row, start.column);
					if(cmp == 0) {
						foldLine = foldLine.split(start.row, start.column);
						foldLine.shiftRow(len);
						foldLine.addRemoveChars(lastRow, 0, end.column - start.column);
					} else if(cmp == -1) {
						foldLine.addRemoveChars(firstRow, 0, end.column - start.column);
						foldLine.shiftRow(len);
					}
					idx = foldLines.indexOf(foldLine) + 1;
				}
				for(idx; idx < foldLines.length; idx++) {
					var foldLine = foldLines[idx];
					if(foldLine.start.row >= firstRow) {
						foldLine.shiftRow(len);
					}
				}
			}
		} else {
			len = Math.abs(e.data.range.start.column - e.data.range.end.column);
			if(action.indexOf("remove") != -1) {
				removedFolds = this.getFoldsInRange(e.data.range);
				this.removeFolds(removedFolds);
				len = -len;
			}
			var foldLine = this.getFoldLine(firstRow);
			if(foldLine) {
				foldLine.addRemoveChars(firstRow, start.column, len);
			}
		}
		if(useWrapMode && this.$wrapData.length != this.doc.getLength()) {
			console.error("doc.getLength() and $wrapData.length have to be the same!");
		}
		if(useWrapMode) {
			this.$updateWrapData(firstRow, lastRow);
		} else {
			this.$updateRowLengthCache(firstRow, lastRow);
		}
		return removedFolds;
	},
	$updateRowLengthCache : function(firstRow, lastRow, b) {
		this.$rowLengthCache[firstRow] = null;
		this.$rowLengthCache[lastRow] = null;
	},
	$updateWrapData : function(firstRow, lastRow) {
		var lines = this.doc.getAllLines();
		var tabSize = this.getTabSize();
		var wrapData = this.$wrapData;
		var wrapLimit = this.$wrapLimit;
		var tokens;
		var foldLine;
		var row = firstRow;
		lastRow = Math.min(lastRow, lines.length - 1);
		while(row <= lastRow) {
			foldLine = this.getFoldLine(row, foldLine);
			if(!foldLine) {
				tokens = this.$getDisplayTokens(lang.stringTrimRight(lines[row]));
				wrapData[row] = this.$computeWrapSplits(tokens, wrapLimit, tabSize);
				row++;
			} else {
				tokens = [];
				foldLine.walk( function(placeholder, row, column, lastColumn) {
					var walkTokens;
					if(placeholder != null) {
						walkTokens = this.$getDisplayTokens(placeholder, tokens.length);
						walkTokens[0] = PLACEHOLDER_START;
						for(var i = 1; i < walkTokens.length; i++) {
							walkTokens[i] = PLACEHOLDER_BODY;
						}
					} else {
						walkTokens = this.$getDisplayTokens(lines[row].substring(lastColumn, column), tokens.length);
					}
					tokens = tokens.concat(walkTokens);
				}.bind(this), foldLine.end.row, lines[foldLine.end.row].length + 1);
				while(tokens.length != 0 && tokens[tokens.length - 1] >= SPACE) {
					tokens.pop();
				}
				wrapData[foldLine.start.row] = this.$computeWrapSplits(tokens, wrapLimit, tabSize);
				row = foldLine.end.row + 1;
			}
		}
	},
	$computeWrapSplits : function(tokens, wrapLimit) {
		if(tokens.length == 0) {
			return [];
		}
		var splits = [];
		var displayLength = tokens.length;
		var lastSplit = 0, lastDocSplit = 0;

		function addSplit(screenPos) {
			var displayed = tokens.slice(lastSplit, screenPos);
			var len = displayed.length;
			displayed.join("").replace(/12/g, function() {
				len -= 1;
			}).replace(/2/g, function() {
				len -= 1;
			});
			lastDocSplit += len;
			splits.push(lastDocSplit);
			lastSplit = screenPos;
		}

		while(displayLength - lastSplit > wrapLimit) {
			var split = lastSplit + wrapLimit;
			if(tokens[split] >= SPACE) {
				while(tokens[split] >= SPACE) {
					split++;
				}
				addSplit(split);
				continue;
			}
			if(tokens[split] == PLACEHOLDER_START || tokens[split] == PLACEHOLDER_BODY) {
				for(split; split != lastSplit - 1; split--) {
					if(tokens[split] == PLACEHOLDER_START) {
						break;
					}
				}
				if(split > lastSplit) {
					addSplit(split);
					continue;
				}
				split = lastSplit + wrapLimit;
				for(split; split < tokens.length; split++) {
					if(tokens[split] != PLACEHOLDER_BODY) {
						break;
					}
				}
				if(split == tokens.length) {
					break;
				}
				addSplit(split);
				continue;
			}
			var minSplit = Math.max(split - 10, lastSplit - 1);
			while(split > minSplit && tokens[split] < PLACEHOLDER_START) {
				split--;
			}
			while(split > minSplit && tokens[split] == PUNCTUATION) {
				split--;
			}
			if(split > minSplit) {
				addSplit(++split);
				continue;
			}
			split = lastSplit + wrapLimit;
			addSplit(split);
		}
		return splits;
	},
	$getDisplayTokens : function(str, offset) {
		var arr = [];
		var tabSize;
		offset = offset || 0;
		for(var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			if(c == 9) {
				tabSize = this.getScreenTabSize(arr.length + offset);
				arr.push(TAB);
				for(var n = 1; n < tabSize; n++) {
					arr.push(TAB_SPACE);
				}
			} else if(c == 32) {
				arr.push(SPACE);
			} else if(c > 39 && c < 48 || c > 57 && c < 64) {
				arr.push(PUNCTUATION);
			} else if(c >= 4352 && isFullWidth(c)) {
				arr.push(CHAR, CHAR_EXT);
			} else {
				arr.push(CHAR);
			}
		}
		return arr;
	},
	$getStringScreenWidth : function(str, maxScreenColumn, screenColumn) {
		if(maxScreenColumn == 0) {
			return [0, 0];
		}
		if(maxScreenColumn == null) {
			maxScreenColumn = Infinity;
		}
		screenColumn = screenColumn || 0;
		var c, column;
		for( column = 0; column < str.length; column++) {
			c = str.charCodeAt(column);
			if(c == 9) {
				screenColumn += this.getScreenTabSize(screenColumn);
			} else if(c >= 4352 && isFullWidth(c)) {
				screenColumn += 2;
			} else {
				screenColumn += 1;
			}
			if(screenColumn > maxScreenColumn) {
				break;
			}
		}
		return [screenColumn, column];
	},
	getRowLength : function(row) {
		if(!this.$useWrapMode || !this.$wrapData[row]) {
			return 1;
		} else {
			return this.$wrapData[row].length + 1;
		}
	},
	getScreenLastRowColumn : function(screenRow) {
		var pos = this.screenToDocumentPosition(screenRow, Number.MAX_VALUE);
		return this.documentToScreenColumn(pos.row, pos.column);
	},
	getDocumentLastRowColumn : function(docRow, docColumn) {
		var screenRow = this.documentToScreenRow(docRow, docColumn);
		return this.getScreenLastRowColumn(screenRow);
	},
	getDocumentLastRowColumnPosition : function(docRow, docColumn) {
		var screenRow = this.documentToScreenRow(docRow, docColumn);
		return this.screenToDocumentPosition(screenRow, Number.MAX_VALUE / 10);
	},
	getRowSplitData : function(row) {
		if(!this.$useWrapMode) {
			return undefined;
		} else {
			return this.$wrapData[row];
		}
	},
	getScreenTabSize : function(screenColumn) {
		return this.$tabSize - screenColumn % this.$tabSize;
	},
	screenToDocumentRow : function(screenRow, screenColumn) {
		return this.screenToDocumentPosition(screenRow, screenColumn).row;
	},
	screenToDocumentColumn : function(screenRow, screenColumn) {
		return this.screenToDocumentPosition(screenRow, screenColumn).column;
	},
	screenToDocumentPosition : function(screenRow, screenColumn) {
		if(screenRow < 0) {
			return {
				row : 0,
				column : 0
			};
		}
		var line;
		var docRow = 0;
		var docColumn = 0;
		var column;
		var row = 0;
		var rowLength = 0;
		var rowCache = this.$screenRowCache;
		var i = this.$getRowCacheIndex(rowCache, screenRow);
		if(0 < i && i < rowCache.length) {
			var row = rowCache[i];
			var docRow = this.$docRowCache[i];
			var doCache = screenRow > row || screenRow == row && i == rowCache.length - 1;
		} else {
			var doCache = i != 0 || !rowCache.length;
		}
		var maxRow = this.getLength() - 1;
		var foldLine = this.getNextFoldLine(docRow);
		var foldStart = foldLine ? foldLine.start.row : Infinity;
		while(row <= screenRow) {
			rowLength = this.getRowLength(docRow);
			if(row + rowLength - 1 >= screenRow || docRow >= maxRow) {
				break;
			} else {
				row += rowLength;
				docRow++;
				if(docRow > foldStart) {
					docRow = foldLine.end.row + 1;
					foldLine = this.getNextFoldLine(docRow, foldLine);
					foldStart = foldLine ? foldLine.start.row : Infinity;
				}
			}
			if(doCache) {
				this.$docRowCache.push(docRow);
				this.$screenRowCache.push(row);
			}
		}
		if(foldLine && foldLine.start.row <= docRow) {
			line = this.getFoldDisplayLine(foldLine);
			docRow = foldLine.start.row;
		} else if(row + rowLength <= screenRow || docRow > maxRow) {
			return {
				row : maxRow,
				column : this.getLine(maxRow).length
			};
		} else {
			line = this.getLine(docRow);
			foldLine = null;
		}
		if(this.$useWrapMode) {
			var splits = this.$wrapData[docRow];
			if(splits) {
				column = splits[screenRow - row];
				if(screenRow > row && splits.length) {
					docColumn = splits[screenRow - row - 1] || splits[splits.length - 1];
					line = line.substring(docColumn);
				}
			}
		}
		docColumn += this.$getStringScreenWidth(line, screenColumn)[1];
		if(this.$useWrapMode && docColumn >= column) {
			docColumn = column - 1;
		}
		if(foldLine) {
			return foldLine.idxToPosition(docColumn);
		}
		return {
			row : docRow,
			column : docColumn
		};
	},
	documentToScreenPosition : function(docRow, docColumn) {
		if( typeof docColumn === "undefined") {
			var pos = this.$clipPositionToDocument(docRow.row, docRow.column);
		} else {
			pos = this.$clipPositionToDocument(docRow, docColumn);
		}
		docRow = pos.row;
		docColumn = pos.column;
		var screenRow = 0;
		var foldStartRow = null;
		var fold = null;
		fold = this.getFoldAt(docRow, docColumn, 1);
		if(fold) {
			docRow = fold.start.row;
			docColumn = fold.start.column;
		}
		var rowEnd, row = 0;
		var rowCache = this.$docRowCache;
		var i = this.$getRowCacheIndex(rowCache, docRow);
		if(0 < i && i < rowCache.length) {
			var row = rowCache[i];
			var screenRow = this.$screenRowCache[i];
			var doCache = docRow > row || docRow == row && i == rowCache.length - 1;
		} else {
			var doCache = i != 0 || !rowCache.length;
		}
		var foldLine = this.getNextFoldLine(row);
		var foldStart = foldLine ? foldLine.start.row : Infinity;
		while(row < docRow) {
			if(row >= foldStart) {
				rowEnd = foldLine.end.row + 1;
				if(rowEnd > docRow) {
					break;
				}
				foldLine = this.getNextFoldLine(rowEnd, foldLine);
				foldStart = foldLine ? foldLine.start.row : Infinity;
			} else {
				rowEnd = row + 1;
			}
			screenRow += this.getRowLength(row);
			row = rowEnd;
			if(doCache) {
				this.$docRowCache.push(row);
				this.$screenRowCache.push(screenRow);
			}
		}
		var textLine = "";
		if(foldLine && row >= foldStart) {
			textLine = this.getFoldDisplayLine(foldLine, docRow, docColumn);
			foldStartRow = foldLine.start.row;
		} else {
			textLine = this.getLine(docRow).substring(0, docColumn);
			foldStartRow = docRow;
		}
		if(this.$useWrapMode) {
			var wrapRow = this.$wrapData[foldStartRow];
			var screenRowOffset = 0;
			while(textLine.length >= wrapRow[screenRowOffset]) {
				screenRow++;
				screenRowOffset++;
			}
			textLine = textLine.substring(wrapRow[screenRowOffset - 1] || 0, textLine.length);
		}
		return {
			row : screenRow,
			column : this.$getStringScreenWidth(textLine)[0]
		};
	},
	documentToScreenColumn : function(row, docColumn) {
		return this.documentToScreenPosition(row, docColumn).column;
	},
	documentToScreenRow : function(docRow, docColumn) {
		return this.documentToScreenPosition(docRow, docColumn).row;
	},
	getScreenLength : function() {
		var screenRows = 0;
		var fold = null;
		if(!this.$useWrapMode) {
			screenRows = this.getLength();
			var foldData = this.$foldData;
			for(var i = 0; i < foldData.length; i++) {
				fold = foldData[i];
				screenRows -= fold.end.row - fold.start.row;
			}
		} else {
			var lastRow = this.$wrapData.length;
			var row = 0, i = 0;
			var fold = this.$foldData[i++];
			var foldStart = fold ? fold.start.row : Infinity;
			while(row < lastRow) {
				screenRows += this.$wrapData[row].length + 1;
				row++;
				if(row > foldStart) {
					row = fold.end.row + 1;
					fold = this.$foldData[i++];
					foldStart = fold ? fold.start.row : Infinity;
				}
			}
		}
		return screenRows;
	}
});

/**
 * 表示编辑器中的一个文档。文档存储了代码的实际内容。
 */
CodeEditor.Document = Class({

	constructor : function() {

	}
});

/**
 * 表示编辑器中的一个视图。视图负责更新编辑器的界面。
 */
CodeEditor.View = Class({
	
	//#region Cursors
	
	cursors: null,
	
	addCursor: function(){
		var el = dom.createElement("div");
        el.className = "ace_cursor";
        this.contentNode.appendChild(el);
        this.cursors.push(el);
        return el;
	},
	
	//#endregion
	
	_moveTextInputToCursor : function() {
		if(!this._keepTextInputAtCursor) {
			return;
		}
		var posTop = this.$cursorLayer.$pixelPos.top;
		var posLeft = this.$cursorLayer.$pixelPos.left;
		posTop -= this.layerConfig.offset;
		if(posTop < 0 || posTop > this.layerConfig.height - this.lineHeight) {
			return;
		}
		var w = this.characterWidth;
		if(this.$composition) {
			w += this.textarea.scrollWidth;
		}
		posLeft -= this.scrollLeft;
		if(posLeft > this.$size.scrollerWidth - w) {
			posLeft = this.$size.scrollerWidth - w;
		}
		if(this.showGutter) {
			posLeft += this.$gutterLayer.gutterWidth;
		}
		this.textarea.style.height = this.lineHeight + "px";
		this.textarea.style.width = w + "px";
		this.textarea.style.left = posLeft + "px";
		this.textarea.style.top = posTop - 1 + "px";
	},
	
	//#region Render
	
	// 渲染引擎是否正在执行。
	_isRendering: false,
	
	_pendingChanges: 0,
	
	/**
	 * 设置指定的改变已经发生，并通知界面重新渲染。
	 */
	scheduleChange: function(change){
		var me = this;
		me._pendingChanges |= change;
		
		if(!me._isRendering) {
			me._isRendering = true;
			event.nextFrame(function() {
                me._isRendering = false;
				var changes;
                while (changes = me._pendingChanges) {
                    me._pendingChanges = 0;
                    me._applyChanges(changes);
                }
               
            }, me._renderLoopWindow);
		}
	},
	
	_applyChanges: function(changes){
		if (changes & this.CHANGE_FULL ||
            changes & this.CHANGE_SIZE ||
            changes & this.CHANGE_TEXT ||
            changes & this.CHANGE_LINES ||
            changes & this.CHANGE_SCROLL
        )
            this._computeLayerConfig();
        if (changes & this.CHANGE_H_SCROLL) {
            this.scroller.scrollLeft = this.scrollLeft;
            var scrollLeft = this.scroller.scrollLeft;
            this.scrollLeft = scrollLeft;
            this.session.setScrollLeft(scrollLeft);

            this.scroller.className = this.scrollLeft == 0 ? "ace_scroller" : "ace_scroller ace_scroll-left";
        }
        if (changes & this.CHANGE_FULL) {
            this.$textLayer.checkForSizeChanges();
            this.$updateScrollBar();
            this.$textLayer.update(this.layerConfig);
            if (this.showGutter)
                this.$gutterLayer.update(this.layerConfig);
            this.$markerBack.update(this.layerConfig);
            this.$markerFront.update(this.layerConfig);
            this.$cursorLayer.update(this.layerConfig);
            this.$moveTextAreaToCursor();
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
            return;
        }
        if (changes & this.CHANGE_SCROLL) {
            this.$updateScrollBar();
            if (changes & this.CHANGE_TEXT || changes & this.CHANGE_LINES)
                this.$textLayer.update(this.layerConfig);
            else
                this.$textLayer.scrollLines(this.layerConfig);

            if (this.showGutter)
                this.$gutterLayer.update(this.layerConfig);
            this.$markerBack.update(this.layerConfig);
            this.$markerFront.update(this.layerConfig);
            this.$cursorLayer.update(this.layerConfig);
            this.$moveTextAreaToCursor();
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
            return;
        }

        if (changes & this.CHANGE_TEXT) {
            this.$textLayer.update(this.layerConfig);
            if (this.showGutter)
                this.$gutterLayer.update(this.layerConfig);
        }
        else if (changes & this.CHANGE_LINES) {
            if (this.$updateLines() || (changes & this.CHANGE_GUTTER) && this.showGutter)
                this.$gutterLayer.update(this.layerConfig);
        }
        else if (changes & this.CHANGE_TEXT || changes & this.CHANGE_GUTTER) {
            if (this.showGutter)
                this.$gutterLayer.update(this.layerConfig);
        }

        if (changes & this.CHANGE_CURSOR) {
            this.$cursorLayer.update(this.layerConfig);
            this.$moveTextAreaToCursor();
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
        }

        if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_FRONT)) {
            this.$markerFront.update(this.layerConfig);
        }

        if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_BACK)) {
            this.$markerBack.update(this.layerConfig);
        }

        if (changes & this.CHANGE_SIZE)
            this.$updateScrollBar();
			
	},
	
	_computeLayerConfig: function() {
		var session = this.session;
		var offset = this.scrollTop % this.lineHeight;
		var minHeight = this.$size.scrollerHeight + this.lineHeight;
		var longestLine = this.$getLongestLine();
		var horizScroll = this.$horizScrollAlwaysVisible || this.$size.scrollerWidth - longestLine < 0;
		var horizScrollChanged = this.$horizScroll !== horizScroll;
		this.$horizScroll = horizScroll;
		if(horizScrollChanged) {
			this.scroller.style.overflowX = horizScroll ? "scroll" : "hidden";
			if(!horizScroll) {
				this.session.setScrollLeft(0);
			}
		}
		var maxHeight = this.session.getScreenLength() * this.lineHeight;
		this.session.setScrollTop(Math.max(0, Math.min(this.scrollTop, maxHeight - this.$size.scrollerHeight)));
		var lineCount = Math.ceil(minHeight / this.lineHeight) - 1;
		var firstRow = Math.max(0, Math.round((this.scrollTop - offset) / this.lineHeight));
		var lastRow = firstRow + lineCount;
		var firstRowScreen, firstRowHeight;
		var lineHeight = this.lineHeight;
		firstRow = session.screenToDocumentRow(firstRow, 0);
		var foldLine = session.getFoldLine(firstRow);
		if(foldLine) {
			firstRow = foldLine.start.row;
		}
		firstRowScreen = session.documentToScreenRow(firstRow, 0);
		firstRowHeight = session.getRowLength(firstRow) * lineHeight;
		lastRow = Math.min(session.screenToDocumentRow(lastRow, 0), session.getLength() - 1);
		minHeight = this.$size.scrollerHeight + session.getRowLength(lastRow) * lineHeight + firstRowHeight;
		offset = this.scrollTop - firstRowScreen * lineHeight;
		this.layerConfig = {
			width : longestLine,
			padding : this.$padding,
			firstRow : firstRow,
			firstRowScreen : firstRowScreen,
			lastRow : lastRow,
			lineHeight : lineHeight,
			characterWidth : this.characterWidth,
			minHeight : minHeight,
			maxHeight : maxHeight,
			offset : offset,
			height : this.$size.scrollerHeight
		};
		this.$gutterLayer.element.style.marginTop = -offset + "px";
		this.content.style.marginTop = -offset + "px";
		this.content.style.width = longestLine + 2 * this.$padding + "px";
		this.content.style.height = minHeight + "px";
		if(horizScrollChanged) {
			this.onResize(true);
		}
	},
	
	//#region ScrollBar
	
	_updateScrollBar: function() {
		this.scrollBar.setInnerHeight(this.layerConfig.maxHeight);
		this.scrollBar.setScrollTop(this.scrollTop);
	},
	
	//#endregion

	//#region Text
	
	// 用于存放文本内容的容器节点。
	_textContainer: null,
	
	// 更新文本内容。
	_updateText: function(){
	
	},
	
	// 更新指定行内的文本内容。
	_updateTextBetween: function(startRow, endRow){
	
		var first = Math.max(firstRow, config.firstRow);
        var last = Math.min(lastRow, config.lastRow);

        var lineElements = this.element.childNodes;
        var lineElementsIdx = 0;

        for (var row = config.firstRow; row < first; row++) {
            var foldLine = this.session.getFoldLine(row);
            if (foldLine) {
                if (foldLine.containsRow(first)) {
                    first = foldLine.start.row;
                    break;
                } else {
                    row = foldLine.end.row;
                }
            }
            lineElementsIdx ++;
        }

        var row = first;
        var foldLine = this.session.getNextFoldLine(row);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row+1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row :Infinity;
            }
            if (row > last)
                break;

            var lineElement = lineElements[lineElementsIdx++];
            if (lineElement) {
                var html = [];
                this.$renderLine(
                    html, row, !this.$useLineGroups(), row == foldStart ? foldLine : false
                );
                dom.setInnerHtml(lineElement, html.join(""));
            }
            row++;
        }
	},
	
	
    _renderLinesFragment: function(config, firstRow, lastRow) {
        var fragment = this.element.ownerDocument.createDocumentFragment();
        var row = firstRow;
        var foldLine = this.session.getNextFoldLine(row);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row+1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row : Infinity;
            }
            if (row > lastRow)
                break;

            var container = dom.createElement("div");

            var html = [];
            this.$renderLine(html, row, false, row == foldStart ? foldLine : false);
            container.innerHTML = html.join("");
            if (this.$useLineGroups()) {
                container.className = 'ace_line_group';
                fragment.appendChild(container);
            } else {
                var lines = container.childNodes
                while(lines.length)
                    fragment.appendChild(lines[0]);
            }

            row++;
        }
        return fragment;
    },
	
	//#endregion

	//#endregion

	constructor : function(editor, containerElement) {
		this.editor = editor;
		this.node = containerElement;
		
		this._pendingChanges = [];
		this._renderLoopWindow = this.editor.node.ownerDocument.defaultView;
		this.cursors = [];
	},
	
	
	showGutter : true,
	CHANGE_CURSOR : 1,
	CHANGE_MARKER : 2,
	CHANGE_GUTTER : 4,
	CHANGE_SCROLL : 8,
	CHANGE_LINES : 16,
	CHANGE_TEXT : 32,
	CHANGE_SIZE : 64,
	CHANGE_MARKER_BACK : 128,
	CHANGE_MARKER_FRONT : 256,
	CHANGE_FULL : 512,
	CHANGE_H_SCROLL : 1024,

	updateCharacterSize : function() {
		if(this.$textLayer.allowBoldFonts != this.$allowBoldFonts) {
			this.$allowBoldFonts = this.$textLayer.allowBoldFonts;
			this.setStyle("ace_nobold", !this.$allowBoldFonts);
		}
		this.characterWidth = this.$textLayer.getCharacterWidth();
		this.lineHeight = this.$textLayer.getLineHeight();
		this.$updatePrintMargin();
	},
	setSession : function(session) {
		this.session = session;
		this.scroller.className = "ace_scroller";
		this.$cursorLayer.setSession(session);
		this.$markerBack.setSession(session);
		this.$markerFront.setSession(session);
		this.$gutterLayer.setSession(session);
		this.$textLayer.setSession(session);
		this.$loop.schedule(this.CHANGE_FULL);
	},
	updateLines : function(firstRow, lastRow) {
		if(lastRow === undefined) {
			lastRow = Infinity;
		}
		if(!this.$changedLines) {
			this.$changedLines = {
				firstRow : firstRow,
				lastRow : lastRow
			};
		} else {
			if(this.$changedLines.firstRow > firstRow) {
				this.$changedLines.firstRow = firstRow;
			}
			if(this.$changedLines.lastRow < lastRow) {
				this.$changedLines.lastRow = lastRow;
			}
		}
		this.$loop.schedule(this.CHANGE_LINES);
	},
	onChangeTabSize : function() {
		this.$loop.schedule(this.CHANGE_TEXT | this.CHANGE_MARKER);
		this.$textLayer.onChangeTabSize();
	},
	updateText : function() {
		this.$loop.schedule(this.CHANGE_TEXT);
	},
	updateFull : function(force) {
		if(force) {
			this.$renderChanges(this.CHANGE_FULL, true);
		} else {
			this.$loop.schedule(this.CHANGE_FULL);
		}
	},
	updateFontSize : function() {
		this.$textLayer.checkForSizeChanges();
	},
	onResize : function(force, gutterWidth, width, height) {
		var changes = this.CHANGE_SIZE;
		var size = this.$size;
		if(this.resizing > 2) {
			return;
		} else if(this.resizing > 1) {
			this.resizing++;
		} else {
			this.resizing = force ? 1 : 0;
		}
		if(!height) {
			height = dom.getInnerHeight(this.container);
		}
		if(force || size.height != height) {
			size.height = height;
			this.scroller.style.height = height + "px";
			size.scrollerHeight = this.scroller.clientHeight;
			this.scrollBar.setHeight(size.scrollerHeight);
			if(this.session) {
				this.session.setScrollTop(this.getScrollTop());
				changes = changes | this.CHANGE_FULL;
			}
		}
		if(!width) {
			width = dom.getInnerWidth(this.container);
		}
		if(force || this.resizing > 1 || size.width != width) {
			size.width = width;
			var gutterWidth = this.showGutter ? this.$gutter.offsetWidth : 0;
			this.scroller.style.left = gutterWidth + "px";
			size.scrollerWidth = Math.max(0, width - gutterWidth - this.scrollBar.getWidth());
			this.scroller.style.right = this.scrollBar.getWidth() + "px";
			if(this.session.getUseWrapMode() && this.adjustWrapLimit() || force) {
				changes = changes | this.CHANGE_FULL;
			}
		}
		if(force) {
			this.$renderChanges(changes, true);
		} else {
			this.$loop.schedule(changes);
		}
		if(force) {
			delete this.resizing;
		}
	},
	adjustWrapLimit : function() {
		var availableWidth = this.$size.scrollerWidth - this.$padding * 2;
		var limit = Math.floor(availableWidth / this.characterWidth);
		return this.session.adjustWrapLimit(limit);
	},
	setAnimatedScroll : function(shouldAnimate) {
		this.$animatedScroll = shouldAnimate;
	},
	getAnimatedScroll : function() {
		return this.$animatedScroll;
	},
	setShowInvisibles : function(showInvisibles) {
		if(this.$textLayer.setShowInvisibles(showInvisibles)) {
			this.$loop.schedule(this.CHANGE_TEXT);
		}
	},
	getShowInvisibles : function() {
		return this.$textLayer.showInvisibles;
	},
	getDisplayIndentGuides : function() {
		return this.$textLayer.displayIndentGuides;
	},
	setDisplayIndentGuides : function(display) {
		if(this.$textLayer.setDisplayIndentGuides(display)) {
			this.$loop.schedule(this.CHANGE_TEXT);
		}
	},
	$showPrintMargin : true,
	setShowPrintMargin : function(showPrintMargin) {
		this.$showPrintMargin = showPrintMargin;
		this.$updatePrintMargin();
	},
	getShowPrintMargin : function() {
		return this.$showPrintMargin;
	},
	$printMarginColumn : 80,
	setPrintMarginColumn : function(showPrintMargin) {
		this.$printMarginColumn = showPrintMargin;
		this.$updatePrintMargin();
	},
	getPrintMarginColumn : function() {
		return this.$printMarginColumn;
	},
	getShowGutter : function() {
		return this.showGutter;
	},
	setShowGutter : function(show) {
		if(this.showGutter === show) {
			return;
		}
		this.$gutter.style.display = show ? "block" : "none";
		this.showGutter = show;
		this.onResize(true);
	},
	getFadeFoldWidgets : function() {
		return dom.hasCssClass(this.$gutter, "ace_fade-fold-widgets");
	},
	setFadeFoldWidgets : function(show) {
		if(show) {
			dom.addCssClass(this.$gutter, "ace_fade-fold-widgets");
		} else {
			dom.removeCssClass(this.$gutter, "ace_fade-fold-widgets");
		}
	},
	$highlightGutterLine : false,
	setHighlightGutterLine : function(shouldHighlight) {
		if(this.$highlightGutterLine == shouldHighlight) {
			return;
		}
		this.$highlightGutterLine = shouldHighlight;
		if(!this.$gutterLineHighlight) {
			this.$gutterLineHighlight = dom.createElement("div");
			this.$gutterLineHighlight.className = "ace_gutter-active-line";
			this.$gutter.appendChild(this.$gutterLineHighlight);
			return;
		}
		this.$gutterLineHighlight.style.display = shouldHighlight ? "" : "none";
		if(this.$cursorLayer.$pixelPos) {
			this.$updateGutterLineHighlight();
		}
	},
	getHighlightGutterLine : function() {
		return this.$highlightGutterLine;
	},
	$updateGutterLineHighlight : function() {
		this.$gutterLineHighlight.style.top = this.$cursorLayer.$pixelPos.top - this.layerConfig.offset + "px";
		this.$gutterLineHighlight.style.height = this.layerConfig.lineHeight + "px";
	},
	$updatePrintMargin : function() {
		if(!this.$showPrintMargin && !this.$printMarginEl) {
			return;
		}
		if(!this.$printMarginEl) {
			var containerEl = dom.createElement("div");
			containerEl.className = "ace_layer ace_print-margin-layer";
			this.$printMarginEl = dom.createElement("div");
			this.$printMarginEl.className = "ace_print-margin";
			containerEl.appendChild(this.$printMarginEl);
			this.content.insertBefore(containerEl, this.content.firstChild);
		}
		var style = this.$printMarginEl.style;
		style.left = this.characterWidth * this.$printMarginColumn + this.$padding + "px";
		style.visibility = this.$showPrintMargin ? "visible" : "hidden";
	},
	getContainerElement : function() {
		return this.container;
	},
	getMouseEventTarget : function() {
		return this.content;
	},
	getTextAreaContainer : function() {
		return this.container;
	},
	
	getFirstVisibleRow : function() {
		return this.layerConfig.firstRow;
	},
	getFirstFullyVisibleRow : function() {
		return this.layerConfig.firstRow + (this.layerConfig.offset === 0 ? 0 : 1);
	},
	getLastFullyVisibleRow : function() {
		var flint = Math.floor((this.layerConfig.height + this.layerConfig.offset) / this.layerConfig.lineHeight);
		return this.layerConfig.firstRow - 1 + flint;
	},
	getLastVisibleRow : function() {
		return this.layerConfig.lastRow;
	},
	$padding : null,
	setPadding : function(padding) {
		this.$padding = padding;
		this.$textLayer.setPadding(padding);
		this.$cursorLayer.setPadding(padding);
		this.$markerFront.setPadding(padding);
		this.$markerBack.setPadding(padding);
		this.$loop.schedule(this.CHANGE_FULL);
		this.$updatePrintMargin();
	},
	getHScrollBarAlwaysVisible : function() {
		return this.$horizScrollAlwaysVisible;
	},
	setHScrollBarAlwaysVisible : function(alwaysVisible) {
		if(this.$horizScrollAlwaysVisible != alwaysVisible) {
			this.$horizScrollAlwaysVisible = alwaysVisible;
			if(!this.$horizScrollAlwaysVisible || !this.$horizScroll) {
				this.$loop.schedule(this.CHANGE_SCROLL);
			}
		}
	},
	
	$updateLines : function() {
		var firstRow = this.$changedLines.firstRow;
		var lastRow = this.$changedLines.lastRow;
		this.$changedLines = null;
		var layerConfig = this.layerConfig;
		if(firstRow > layerConfig.lastRow + 1) {
			return;
		}
		if(lastRow < layerConfig.firstRow) {
			return;
		}
		if(lastRow === Infinity) {
			if(this.showGutter) {
				this.$gutterLayer.update(layerConfig);
			}
			this.$textLayer.update(layerConfig);
			return;
		}
		this.$textLayer.updateLines(layerConfig, firstRow, lastRow);
		return true;
	},
	$getLongestLine : function() {
		var charCount = this.session.getScreenWidth();
		if(this.$textLayer.showInvisibles) {
			charCount += 1;
		}
		return Math.max(this.$size.scrollerWidth - 2 * this.$padding, Math.round(charCount * this.characterWidth));
	},
	updateFrontMarkers : function() {
		this.$markerFront.setMarkers(this.session.getMarkers(true));
		this.$loop.schedule(this.CHANGE_MARKER_FRONT);
	},
	updateBackMarkers : function() {
		this.$markerBack.setMarkers(this.session.getMarkers());
		this.$loop.schedule(this.CHANGE_MARKER_BACK);
	},
	addGutterDecoration : function(row, className) {
		this.$gutterLayer.addGutterDecoration(row, className);
	},
	removeGutterDecoration : function(row, className) {
		this.$gutterLayer.removeGutterDecoration(row, className);
	},
	updateBreakpoints : function(rows) {
		this.$loop.schedule(this.CHANGE_GUTTER);
	},
	setAnnotations : function(annotations) {
		this.$gutterLayer.setAnnotations(annotations);
		this.$loop.schedule(this.CHANGE_GUTTER);
	},
	updateCursor : function() {
		this.$loop.schedule(this.CHANGE_CURSOR);
	},
	hideCursor : function() {
		this.$cursorLayer.hideCursor();
	},
	showCursor : function() {
		this.$cursorLayer.showCursor();
	},
	scrollSelectionIntoView : function(anchor, lead, offset) {
		this.scrollCursorIntoView(anchor, offset);
		this.scrollCursorIntoView(lead, offset);
	},
	scrollCursorIntoView : function(cursor, offset) {
		if(this.$size.scrollerHeight === 0) {
			return;
		}
		var pos = this.$cursorLayer.getPixelPosition(cursor);
		var left = pos.left;
		var top = pos.top;
		if(this.scrollTop > top) {
			if(offset) {
				top -= offset * this.$size.scrollerHeight;
			}
			this.session.setScrollTop(top);
		} else if(this.scrollTop + this.$size.scrollerHeight < top + this.lineHeight) {
			if(offset) {
				top += offset * this.$size.scrollerHeight;
			}
			this.session.setScrollTop(top + this.lineHeight - this.$size.scrollerHeight);
		}
		var scrollLeft = this.scrollLeft;
		if(scrollLeft > left) {
			if(left < this.$padding + 2 * this.layerConfig.characterWidth) {
				left = 0;
			}
			this.session.setScrollLeft(left);
		} else if(scrollLeft + this.$size.scrollerWidth < left + this.characterWidth) {
			this.session.setScrollLeft(Math.round(left + this.characterWidth - this.$size.scrollerWidth));
		}
	},
	getScrollTop : function() {
		return this.session.getScrollTop();
	},
	getScrollLeft : function() {
		return this.session.getScrollLeft();
	},
	getScrollTopRow : function() {
		return this.scrollTop / this.lineHeight;
	},
	getScrollBottomRow : function() {
		return Math.max(0, Math.floor((this.scrollTop + this.$size.scrollerHeight) / this.lineHeight) - 1);
	},
	scrollToRow : function(row) {
		this.session.setScrollTop(row * this.lineHeight);
	},
	alignCursor : function(cursor, alignment) {
		if( typeof cursor == "number") {
			cursor = {
				row : cursor,
				column : 0
			};
		}
		var pos = this.$cursorLayer.getPixelPosition(cursor);
		var h = this.$size.scrollerHeight - this.lineHeight;
		var offset = pos.top - h * (alignment || 0);
		this.session.setScrollTop(offset);
		return offset;
	},
	STEPS : 8,
	$calcSteps : function(fromValue, toValue) {
		var i = 0;
		var l = this.STEPS;
		var steps = [];
		var func = function(t, x_min, dx) {
			return dx * (Math.pow(t - 1, 3) + 1) + x_min;
		};
		for( i = 0; i < l; ++i) {
			steps.push(func(i / this.STEPS, fromValue, toValue - fromValue));
		}
		return steps;
	},
	scrollToLine : function(line, center, animate, callback) {
		var pos = this.$cursorLayer.getPixelPosition({
			row : line,
			column : 0
		});
		var offset = pos.top;
		if(center) {
			offset -= this.$size.scrollerHeight / 2;
		}
		var initialScroll = this.scrollTop;
		this.session.setScrollTop(offset);
		if(animate !== false) {
			this.animateScrolling(initialScroll, callback);
		}
	},
	animateScrolling : function(fromValue, callback) {
		var toValue = this.scrollTop;
		if(this.$animatedScroll && Math.abs(fromValue - toValue) < 100000) {
			var _self = this;
			var steps = _self.$calcSteps(fromValue, toValue);
			this.$inScrollAnimation = true;
			clearInterval(this.$timer);
			_self.session.setScrollTop(steps.shift());
			this.$timer = setInterval(function() {
				if(steps.length) {
					_self.session.setScrollTop(steps.shift());
					_self.session.$scrollTop = toValue;
				} else if(toValue != null) {
					_self.session.$scrollTop = -1;
					_self.session.setScrollTop(toValue);
					toValue = null;
				} else {
					_self.$timer = clearInterval(_self.$timer);
					_self.$inScrollAnimation = false;
					callback && callback();
				}
			}, 10);
		}
	},
	scrollToY : function(scrollTop) {
		if(this.scrollTop !== scrollTop) {
			this.$loop.schedule(this.CHANGE_SCROLL);
			this.scrollTop = scrollTop;
		}
	},
	scrollToX : function(scrollLeft) {
		if(scrollLeft < 0) {
			scrollLeft = 0;
		}
		if(this.scrollLeft !== scrollLeft) {
			this.scrollLeft = scrollLeft;
		}
		this.$loop.schedule(this.CHANGE_H_SCROLL);
	},
	scrollBy : function(deltaX, deltaY) {
		deltaY && this.session.setScrollTop(this.session.getScrollTop() + deltaY);
		deltaX && this.session.setScrollLeft(this.session.getScrollLeft() + deltaX);
	},
	isScrollableBy : function(deltaX, deltaY) {
		if(deltaY < 0 && this.session.getScrollTop() > 0) {
			return true;
		}
		if(deltaY > 0 && this.session.getScrollTop() + this.$size.scrollerHeight < this.layerConfig.maxHeight) {
			return true;
		}
	},
	pixelToScreenCoordinates : function(x, y) {
		var canvasPos = this.scroller.getBoundingClientRect();
		var offset = (x + this.scrollLeft - canvasPos.left - this.$padding) / this.characterWidth;
		var row = Math.floor((y + this.scrollTop - canvasPos.top) / this.lineHeight);
		var col = Math.round(offset);
		return {
			row : row,
			column : col,
			side : offset - col > 0 ? 1 : -1
		};
	},
	screenToTextCoordinates : function(x, y) {
		var canvasPos = this.scroller.getBoundingClientRect();
		var col = Math.round((x + this.scrollLeft - canvasPos.left - this.$padding) / this.characterWidth);
		var row = Math.floor((y + this.scrollTop - canvasPos.top) / this.lineHeight);
		return this.session.screenToDocumentPosition(row, Math.max(col, 0));
	},
	textToScreenCoordinates : function(row, column) {
		var canvasPos = this.scroller.getBoundingClientRect();
		var pos = this.session.documentToScreenPosition(row, column);
		var x = this.$padding + Math.round(pos.column * this.characterWidth);
		var y = pos.row * this.lineHeight;
		return {
			pageX : canvasPos.left + x - this.scrollLeft,
			pageY : canvasPos.top + y - this.scrollTop
		};
	},
	visualizeFocus : function() {
		dom.addCssClass(this.container, "ace_focus");
	},
	visualizeBlur : function() {
		dom.removeCssClass(this.container, "ace_focus");
	},
	showComposition : function(position) {
		if(!this.$composition) {
			this.$composition = {
				keepTextAreaAtCursor : this.$keepTextAreaAtCursor,
				cssText : this.textarea.style.cssText
			};
		}
		this.$keepTextAreaAtCursor = true;
		dom.addCssClass(this.textarea, "ace_composition");
		this.textarea.style.cssText = "";
		this.$moveTextAreaToCursor();
	},
	setCompositionText : function(text) {
		this.$moveTextAreaToCursor();
	},
	hideComposition : function() {
		if(!this.$composition) {
			return;
		}
		dom.removeCssClass(this.textarea, "ace_composition");
		this.$keepTextAreaAtCursor = this.$composition.keepTextAreaAtCursor;
		this.textarea.style.cssText = this.$composition.cssText;
		this.$composition = null;
	},
	_loadTheme : function(name, callback) {
		if(!config.get("packaged")) {
			return callback();
		}
		net.loadScript(config.moduleUrl(name, "theme"), callback);
	},
	setTheme : function(theme) {
		var _self = this;
		this.$themeValue = theme;
		if(!theme || typeof theme == "string") {
			var moduleName = theme || "ace/theme/textmate";
			var module;
			try {
				module = require(moduleName);
			} catch (e) {
			}
			if(module) {
				return afterLoad(module);
			}
			_self._loadTheme(moduleName, function() {
				require([moduleName], function(module) {
					if(_self.$themeValue !== theme) {
						return;
					}
					afterLoad(module);
				});
			});
		} else {
			afterLoad(theme);
		}

		function afterLoad(theme) {
			dom.importCssString(theme.cssText, theme.cssClass, _self.container.ownerDocument);
			if(_self.$theme) {
				dom.removeCssClass(_self.container, _self.$theme);
			}
			_self.$theme = theme ? theme.cssClass : null;
			if(_self.$theme) {
				dom.addCssClass(_self.container, _self.$theme);
			}
			if(theme && theme.isDark) {
				dom.addCssClass(_self.container, "ace_dark");
			} else {
				dom.removeCssClass(_self.container, "ace_dark");
			}
			if(_self.$size) {
				_self.$size.width = 0;
				_self.onResize();
			}
		}

	},
	getTheme : function() {
		return this.$themeValue;
	},
	setStyle : function setStyle(style, include) {
		dom.setCssClass(this.container, style, include != false);
	},
	unsetStyle : function unsetStyle(style) {
		dom.removeCssClass(this.container, style);
	},
	destroy : function() {
		this.$textLayer.destroy();
		this.$cursorLayer.destroy();
	},
});

/**
 * 表示编辑器中的光标。
 */
CodeEditor.Cursor = Class({
	
	
});

/**
 * 表示编辑器中的事件输入来源。
 */
CodeEditor.TextInput = Class({

	constructor : function(editor) {
		var host = editor;
		var parentNode = editor.node;

		var text = dom.createElement("textarea");
		text.className = "ace_text-input";
		if(useragent.isTouchPad)
			text.setAttribute("x-palm-disable-auto-cap", true);

		text.wrap = "off";
		text.spellcheck = false;

		text.style.top = "-2em";
		parentNode.insertBefore(text, parentNode.firstChild);

		var PLACEHOLDER = useragent.isIE ? "\x01" : "\x00";
		reset(true);
		if(isFocused())
			editor.onFocus();

		var inCompostion = false;
		var copied = false;
		var pasted = false;
		var tempStyle = '';

		function reset(full) {
			try {
				if(full) {
					text.value = PLACEHOLDER;
					text.selectionStart = 0;
					text.selectionEnd = 1;
				} else
					text.select();
			} catch (e) {
			}
		}

		function sendText(valueToSend) {
			if(!copied) {
				var value = valueToSend || text.value;
				if(value) {
					if(value.length > 1) {
						if(value.charAt(0) == PLACEHOLDER)
							value = value.substr(1);
						else if(value.charAt(value.length - 1) == PLACEHOLDER)
							value = value.slice(0, -1);
					}

					if(value && value != PLACEHOLDER) {
						if(pasted)
							host.onPaste(value);
						else
							host.onTextInput(value);
					}
				}
			}
			copied = false;
			pasted = false;
			reset(true);
		}

		var onTextInput = function(e) {
			if(!inCompostion)
				sendText(e.data);
			setTimeout(function() {
				if(!inCompostion)
					reset(true);
			}, 0);
		};
		var onPropertyChange = function(e) {
			setTimeout(function() {
				if(!inCompostion)
					if(text.value != "") {
						sendText();
					}
			}, 0);
		};
		var onCompositionStart = function(e) {
			inCompostion = true;
			editor.onCompositionStart();
			setTimeout(onCompositionUpdate, 0);
		};
		var onCompositionUpdate = function() {
			if(!inCompostion)
				return;
			editor.onCompositionUpdate(text.value);
		};
		var onCompositionEnd = function(e) {
			inCompostion = false;
			editor.onCompositionEnd();
		};
		var onCopy = function(e) {
			copied = true;
			var copyText = host.getCopyText();
			if(copyText)
				text.value = copyText;
			else
				e.preventDefault();
			reset();
			setTimeout(function() {
				sendText();
			}, 0);
		};
		var onCut = function(e) {
			copied = true;
			var copyText = host.getCopyText();
			if(copyText) {
				text.value = copyText;
				host.onCut();
			} else
				e.preventDefault();
			reset();
			setTimeout(function() {
				sendText();
			}, 0);
		};

		event.addCommandKeyListener(text, host.onCommandKey.bind(host));
		event.addListener(text, "input", onTextInput);

		if(useragent.isOldIE) {
			var keytable = {
				13 : 1,
				27 : 1
			};
			event.addListener(text, "keyup", function(e) {
				if(inCompostion && (!text.value || keytable[e.keyCode]))
					setTimeout(onCompositionEnd, 0);
				if((text.value.charCodeAt(0) | 0) < 129) {
					return;
				}
				inCompostion ? onCompositionUpdate() : onCompositionStart();
			});

			event.addListener(text, "propertychange", function() {
				if(text.value != PLACEHOLDER)
					setTimeout(sendText, 0);
			});
		}

		event.addListener(text, "paste", function(e) {
			pasted = true;
			if(e.clipboardData && e.clipboardData.getData) {
				sendText(e.clipboardData.getData("text/plain"));
				e.preventDefault();
			} else {
				onPropertyChange();
			}
		});
		if("onbeforecopy" in text && typeof clipboardData !== "undefined") {
			event.addListener(text, "beforecopy", function(e) {
				if(tempStyle)
					return;
				// without this text is copied when contextmenu is shown
				var copyText = host.getCopyText();
				if(copyText)
					clipboardData.setData("Text", copyText);
				else
					e.preventDefault();
			});
			event.addListener(parentNode, "keydown", function(e) {
				if(e.ctrlKey && e.keyCode == 88) {
					var copyText = host.getCopyText();
					if(copyText) {
						clipboardData.setData("Text", copyText);
						host.onCut();
					}
					event.preventDefault(e);
				}
			});
			event.addListener(text, "cut", onCut);
			// for ie9 context menu
		} else if(useragent.isOpera && !("KeyboardEvent" in window)) {
			event.addListener(parentNode, "keydown", function(e) {
				if((useragent.isMac && !e.metaKey) || !e.ctrlKey)
					return;

				if((e.keyCode == 88 || e.keyCode == 67)) {
					var copyText = host.getCopyText();
					if(copyText) {
						text.value = copyText;
						text.select();
						if(e.keyCode == 88)
							host.onCut();
					}
				}
			});
		} else {
			event.addListener(text, "copy", onCopy);
			event.addListener(text, "cut", onCut);
		}

		event.addListener(text, "compositionstart", onCompositionStart);
		if(useragent.isGecko) {
			event.addListener(text, "text", onCompositionUpdate);
		}
		if(useragent.isWebKit) {
			event.addListener(text, "keyup", onCompositionUpdate);
		}
		event.addListener(text, "compositionend", onCompositionEnd);

		event.addListener(text, "blur", function() {
			editor.onBlur();
		});

		event.addListener(text, "focus", function() {
			editor.onFocus();
			reset();
		});

		this.focus = function() {
			reset();
			text.focus();
		};

		this.blur = function() {
			text.blur();
		};
		function isFocused() {
			return document.activeElement === text;
		}


		this.isFocused = isFocused;

		this.getElement = function() {
			return text;
		};

		this.onContextMenu = function(e) {
			if(!tempStyle)
				tempStyle = text.style.cssText;

			text.style.cssText = "position:fixed; z-index:100000;" + (useragent.isIE ? "background:rgba(0, 0, 0, 0.03); opacity:0.1;" : "") + //"background:rgba(250, 0, 0, 0.3); opacity:1;" +
			"left:" + (e.clientX - 2) + "px; top:" + (e.clientY - 2) + "px;";

			if(host.selection.isEmpty())
				text.value = "";
			else
				reset(true);

			if(e.type != "mousedown")
				return;

			if(host.renderer.$keepTextAreaAtCursor)
				host.renderer.$keepTextAreaAtCursor = null;
			if(useragent.isWin)
				event.capture(host.container, function(e) {
					text.style.left = e.clientX - 2 + "px";
					text.style.top = e.clientY - 2 + "px";
				}, onContextMenuClose);
		};
		function onContextMenuClose() {
			setTimeout(function() {
				if(tempStyle) {
					text.style.cssText = tempStyle;
					tempStyle = '';
				}
				sendText();
				if(host.renderer.$keepTextAreaAtCursor == null) {
					host.renderer.$keepTextAreaAtCursor = true;
					host.renderer.$moveTextAreaToCursor();
				}
			}, 0);
		};


		this.onContextMenuClose = onContextMenuClose;
		if(!useragent.isGecko)
			event.addListener(text, "contextmenu", function(e) {
				host.textInput.onContextMenu(e);
				onContextMenuClose()
			});
	}
});
