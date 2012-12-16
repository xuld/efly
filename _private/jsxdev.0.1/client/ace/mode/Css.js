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
include('ace/mode/CssHighlightRules.js');
include('ace/mode/MatchingBraceOutdent.js');
include('ace/mode/folding/Fold.js');
include('ace/mode/CssWorker.js');
include('Jsx/Thread.js');

define(function() {

    Class('ace.mode.Css', ace.mode.Text, {

        Css: function() {
            this.$tokenizer = new ace.Tokenizer(new ace.mode.CssHighlightRules().getRules());
            this.$outdent = new ace.mode.MatchingBraceOutdent();
            this.foldingRules = new ace.mode.folding.Cstyle();
        },

        foldingRules: "cStyle",

        getNextLineIndent: function(state, line, tab) {
            var indent = this.$getIndent(line);

            // ignore braces in comments
            var tokens = this.$tokenizer.getLineTokens(line, state).tokens;
            if (tokens.length && tokens[tokens.length - 1].type == "comment") {
                return indent;
            }

            var match = line.match(/^.*\{\s*$/);
            if (match) {
                indent += tab;
            }

            return indent;
        },

        checkOutdent: function(state, line, input) {
            return this.$outdent.checkOutdent(line, input);
        },

        autoOutdent: function(state, doc, row) {
            this.$outdent.autoOutdent(doc, row);
        },

        createWorker: function(session) {
            var doc = session.getDocument();

            //UPDATE
            var thread = new Jsx.Thread('ace/mode/CssWorker.js', 'ace.mode.CssWorker');

            thread.call("setValue", [doc.getValue()]);

            //UPDATE

            function changeHandler(e) {

                thread.call('change', [e.data]); //UPDATE
            }

            doc.on("change", changeHandler);

            thread.on("csslint", function(e) {
                var errors = [];
                e.data.forEach(function(message) {
                    errors.push({
                        row: message.line - 1,
                        column: message.col - 1,
                        text: message.message,
                        type: message.type,
                        lint: message
                    });
                });

                session.setAnnotations(errors);
            });


            thread.on("unload", function() {
            
                session.clearAnnotations();
                doc.removeEventListener('change', changeHandler);

            });

            return thread;

        }

    });

});
