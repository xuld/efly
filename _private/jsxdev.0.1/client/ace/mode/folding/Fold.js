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

include('ace/Range.js');

define(function() {

    Class('ace.mode.folding.Fold', null, {

        FOO: 12,
        foldingStartMarker: null,
        foldingStopMarker: null,

        getFoldWidget: function(session, row) {
            if (this.foldingStartMarker) {
                if (this.foldingStopMarker)
                    return this.$testBoth(session, row);
                else
                    return this.$testStart(session, row);
            }
            else
                return "";
        },

        getFoldWidgetRange: function(session, row) {
            return null;
        },

        indentationBlock: function(session, row) {
            var re = /^\s*/;
            var startRow = row, endRow = row;
            var line = session.getLine(row);
            var startColumn = line.length - 1;
            var startLevel = line.match(re)[0].length;

            while (line = session.getLine(++row)) {
                var level = line.match(re)[0].length;

                if (level == line.length)
                    continue;

                if (level <= startLevel)
                    break;

                endRow = row;
            }

            if (endRow > startRow) {
                var endColumn = session.getLine(endRow).length;
                return new ace.Range(startRow, startColumn, endRow, endColumn);
            }
        },

        $testStart: function(session, row) {
            if (this.foldingStartMarker.test(session.getLine(row)))
                return "start";
            return "";
        },

        $testBoth: function(session, row) {

            var line = session.getLine(row);
            if (this.foldingStartMarker.test(line))
                return "start";
            if (this.foldingStopMarker.test(line)) 
                return "end";
            return "";
        }

    });

});
