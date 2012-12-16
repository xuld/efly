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
*  Julian Viereck <julian.viereck@gmail.com>
*
* Portions created by the Initial Developer are Copyright (C) 2010
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
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

include('ace/lib/Dom.js');
include('ace/lib/Lang.js');
include('ace/lib/EventEmitter.js');
include('ace/Editor.js');
include('ace/VirtualRenderer.js');
include('ace/EditSession.js');

define(function() {

    var dom = ace.lib.Dom;
    var lang = ace.lib.Lang;

    var Editor = ace.Editor;
    var Renderer = ace.VirtualRenderer;
    var EditSession = ace.EditSession;

    Class('ace.Split', ace.lib.EventEmitter, {

        Split: function(container, theme, splits) {
            this.BELOW = 1;
            this.BESIDE = 0;

            this.$container = container;
            this.$theme = theme;
            this.$splits = 0;
            this.$editorCSS = "";
            this.$editors = [];
            this.$oriantation = this.BESIDE;

            this.setSplits(splits || 1);
            this.$cEditor = this.$editors[0];


            this.on("focus", function(editor) {
                this.$cEditor = editor;
            } .bind(this));
        },

        $createEditor: function() {
            var el = document.createElement("div");
            el.className = this.$editorCSS;
            el.style.cssText = "position: absolute; top:0px; bottom:0px";
            this.$container.appendChild(el);
            var session = new EditSession("");
            var editor = new Editor(new Renderer(el, this.$theme));

            editor.on("focus", function() {
                this._emit("focus", editor);
            } .bind(this));

            this.$editors.push(editor);
            editor.setFontSize(this.$fontSize);
            return editor;
        },

        setSplits: function(splits) {
            var editor;
            if (splits < 1) {
                throw "The number of splits have to be > 0!";
            }

            if (splits == this.$splits) {
                return;
            } else if (splits > this.$splits) {
                while (this.$splits < this.$editors.length && this.$splits < splits) {
                    editor = this.$editors[this.$splits];
                    this.$container.appendChild(editor.container);
                    editor.setFontSize(this.$fontSize);
                    this.$splits++;
                }
                while (this.$splits < splits) {
                    this.$createEditor();
                    this.$splits++;
                }
            } else {
                while (this.$splits > splits) {
                    editor = this.$editors[this.$splits - 1];
                    this.$container.removeChild(editor.container);
                    this.$splits--;
                }
            }
            this.resize();
        },

        getSplits: function() {
            return this.$splits;
        },

        getEditor: function(idx) {
            return this.$editors[idx];
        },

        getCurrentEditor: function() {
            return this.$cEditor;
        },

        focus: function() {
            this.$cEditor.focus();
        },

        blur: function() {
            this.$cEditor.blur();
        },

        setTheme: function(theme) {
            this.$editors.forEach(function(editor) {
                editor.setTheme(theme);
            });
        },

        setKeyboardHandler: function(keybinding) {
            this.$editors.forEach(function(editor) {
                editor.setKeyboardHandler(keybinding);
            });
        },

        forEach: function(callback, scope) {
            this.$editors.forEach(callback, scope);
        },

        $fontSize: "",
        setFontSize: function(size) {
            this.$fontSize = size;
            this.forEach(function(editor) {
                editor.setFontSize(size);
            });
        },

        $cloneSession: function(session) {
            var s = new EditSession(session.getDocument(), session.getMode());

            var undoManager = session.getUndoManager();
            if (undoManager) {
                var undoManagerProxy = new UndoManagerProxy(undoManager, s);
                s.setUndoManager(undoManagerProxy);
            }

            // Overwrite the default $informUndoManager function such that new delas
            // aren't added to the undo manager from the new and the old session.
            s.$informUndoManager = lang.deferredCall(function() { s.$deltas = []; });

            // Copy over 'settings' from the session.
            s.setTabSize(session.getTabSize());
            s.setUseSoftTabs(session.getUseSoftTabs());
            s.setOverwrite(session.getOverwrite());
            s.setBreakpoints(session.getBreakpoints());
            s.setUseWrapMode(session.getUseWrapMode());
            s.setUseWorker(session.getUseWorker());
            s.setWrapLimitRange(session.$wrapLimitRange.min,
                            session.$wrapLimitRange.max);
            s.$foldData = session.$cloneFoldData();

            return s;
        },

        setSession: function(session, idx) {
            var editor
            if (idx == null) {
                editor = this.$cEditor;
            } else {
                editor = this.$editors[idx];
            }

            // Check if the session is used already by any of the editors in the
            // split. If it is, we have to clone the session as two editors using
            // the same session can cause terrible side effects (e.g. UndoQueue goes
            // wrong). This also gives the user of Split the possibility to treat
            // each session on each split editor different.
            var isUsed = this.$editors.some(function(editor) {
                return editor.session === session;
            });

            if (isUsed) {
                session = this.$cloneSession(session);
            }
            editor.setSession(session);

            // Return the session set on the editor. This might be a cloned one.
            return session;
        },

        getOriantation: function() {
            return this.$oriantation;
        },

        setOriantation: function(oriantation) {
            if (this.$oriantation == oriantation) {
                return;
            }
            this.$oriantation = oriantation;
            this.resize();
        },

        resize: function() {
            var width = this.$container.clientWidth;
            var height = this.$container.clientHeight;
            var editor;

            if (this.$oriantation == this.BESIDE) {
                var editorWidth = width / this.$splits;
                for (var i = 0; i < this.$splits; i++) {
                    editor = this.$editors[i];
                    editor.container.style.width = editorWidth + "px";
                    editor.container.style.top = "0px";
                    editor.container.style.left = i * editorWidth + "px";
                    editor.container.style.height = height + "px";
                    editor.resize();
                }
            } else {
                var editorHeight = height / this.$splits;
                for (var i = 0; i < this.$splits; i++) {
                    editor = this.$editors[i];
                    editor.container.style.width = width + "px";
                    editor.container.style.top = i * editorHeight + "px";
                    editor.container.style.left = "0px";
                    editor.container.style.height = editorHeight + "px";
                    editor.resize();
                }
            }
        }


    });

    var UndoManagerProxy =

    Class('ace.UndoManagerProxy', {

        UndoManagerProxy: function(undoManager, session) {
            this.$u = undoManager;
            this.$doc = session;
        },

        execute: function(options) {
            this.$u.execute(options);
        },

        undo: function() {
            var selectionRange = this.$u.undo(true);
            if (selectionRange) {
                this.$doc.selection.setSelectionRange(selectionRange);
            }
        },

        redo: function() {
            var selectionRange = this.$u.redo(true);
            if (selectionRange) {
                this.$doc.selection.setSelectionRange(selectionRange);
            }
        },

        reset: function() {
            this.$u.reset();
        },

        hasUndo: function() {
            return this.$u.hasUndo();
        },

        hasRedo: function() {
            return this.$u.hasRedo();
        }

    });

});
