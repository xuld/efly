/* ***** BEGIN LICENSE BLOCK *****
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
*      Gastón Kleiman <gaston.kleiman AT gmail DOT com>
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

include('ace/mode/Text.js');
include('ace/Tokenizer.js');
include('ace/mode/CcppHighlightRules.js');
include('ace/mode/MatchingBraceOutdent.js');
include('ace/Range.js');
include('ace/mode/behaviour/CstyleBehaviour.js');
include('ace/mode/folding/Cstyle.js');

define(function() {

    Class('ace.mode.Ccpp', ace.mode.Text, {

        Ccpp: function() {
            this.$tokenizer = new ace.Tokenizer(new ace.mode.CcppHighlightRules().getRules());
            this.$outdent = new ace.mode.MatchingBraceOutdent();
            this.$behaviour = new ace.mode.behaviour.CstyleBehaviour();
            this.foldingRules = new ace.mode.folding.Cstyle();
        },

        toggleCommentLines: function(state, doc, startRow, endRow) {
            var outdent = true;
            var re = /^(\s*)\/\//;

            for (var i = startRow; i <= endRow; i++) {
                if (!re.test(doc.getLine(i))) {
                    outdent = false;
                    break;
                }
            }

            if (outdent) {
                var deleteRange = new ace.Range(0, 0, 0, 0);
                for (var i = startRow; i <= endRow; i++) {
                    var line = doc.getLine(i);
                    var m = line.match(re);
                    deleteRange.start.row = i;
                    deleteRange.end.row = i;
                    deleteRange.end.column = m[0].length;
                    doc.replace(deleteRange, m[1]);
                }
            }
            else {
                doc.indentRows(startRow, endRow, "//");
            }
        },

        getNextLineIndent: function(state, line, tab) {
            var indent = this.$getIndent(line);

            var tokenizedLine = this.$tokenizer.getLineTokens(line, state);
            var tokens = tokenizedLine.tokens;
            var endState = tokenizedLine.state;

            if (tokens.length && tokens[tokens.length - 1].type == "comment") {
                return indent;
            }

            if (state == "start") {
                var match = line.match(/^.*[\{\(\[]\s*$/);
                if (match) {
                    indent += tab;
                }
            } else if (state == "doc-start") {
                if (endState == "start") {
                    return "";
                }
                var match = line.match(/^\s*(\/?)\*/);
                if (match) {
                    if (match[1]) {
                        indent += " ";
                    }
                    indent += "* ";
                }
            }

            return indent;
        },

        checkOutdent: function(state, line, input) {
            return this.$outdent.checkOutdent(line, input);
        },

        autoOutdent: function(state, doc, row) {
            this.$outdent.autoOutdent(doc, row);
        }

    });

});
