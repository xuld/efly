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


include('ace/lib/FixOldBrowsers.js');
include('ace/lib/EventEmitter.js');
include('ace/worker/Mirror.js');
include('ace/worker/Jshint.js');
//include('ace/worker/Jslint.js');
include('narcissus/Jsparse.js');
include('Jsx/Delegate.js');


define(function() {

    Class('ace.mode.JavaScriptWorker', ace.worker.Mirror, {

        JavaScriptWorker: function() {
            this.Mirror();
            this.setTimeout(500);
            //UPDATE
            //this.onnarcissus = new Jsx.Delegate(this, 'narcissus');
            //this.onjslint = new Jsx.Delegate(this, 'jslint');
            Jsx.Delegate.def(this, 'narcissus', 'jslint');
        },

        onUpdate: function() {

            var lint = ace.worker.Jshint.JSHINT;
            //var lint = ace.worker.Jslint.JSLINT;

            var value = this.doc.getValue();
            value = value.replace(/^#!.*\n/, "\n");

            var parser = narcissus.Jsparse;

            try {

                //code, filename, lineno
                var node = parser.parse(value);

            } catch (e) {

                //UPDATE
                var chunks = e.message.split(":");
                var filename = chunks.shift().trim();
                var lineNumber = parseInt(chunks.shift().trim()) - 1;
                var message = chunks.join(':');

                //UPDATE
                this.onnarcissus.emit({
                    row: lineNumber,
                    column: null, // TODO convert e.cursor
                    text: message,
                    type: 'error'
                });

                return;
            } finally {

            }

            lint(value, { undef: false, onevar: false, passfail: false, maxerr: 1e7 });

            //UPDATE
            this.onjslint.emit(lint.errors);
        }

    });

});