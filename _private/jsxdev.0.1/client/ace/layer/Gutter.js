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

include('ace/lib/Dom.js');
include('ace/lib/Event.js');
include('Jsx/Util.js');

define(function() {

    var dom = ace.lib.Dom;
    var Event = ace.lib.Event;

    Class('ace.layer.Gutter', null, {

        Gutter: function(parentEl) {
            this.element = dom.createElement("div");
            this.element.className = "ace_layer ace_gutter-layer";
            parentEl.appendChild(this.element);
            this.setShowFoldWidgets(this.$showFoldWidgets);

            //default event
            var _this = this;
            Event.addListener(parentEl, 'click', function(e) {
                var target = e.target;
                var row = target.getAttribute('row');
                if (!row)
                    return;

                var row = parseInt(row);
                if (_this.$breakpoints[row])
                    _this.session.clearBreakpoint(row);
                else
                    _this.session.setBreakpoint(row);
            });

            this.$breakpoints = [];
            this.$annotations = [];
            this.$decorations = [];
            this.$break = -1;
        },

        setSession: function(session) {
            this.session = session;
        },

        addGutterDecoration: function(row, className) {
            if (!this.$decorations[row])
                this.$decorations[row] = "";
            this.$decorations[row] += " ace_" + className;
        },

        removeGutterDecoration: function(row, className) {
            this.$decorations[row] = this.$decorations[row].replace(" ace_" + className, "");
        },

        setBreak: function(row) {
            this.$break = row;
        },

        setBreakpoints: function(rows) {
            this.$breakpoints = rows.concat();
        },

        setAnnotations: function(annotations) {
            // iterate over sparse array
            this.$annotations = [];
            for (var row in annotations) {
                if (annotations.hasOwnProperty(row)) {
                    var rowAnnotations = annotations[row];
                    if (!rowAnnotations)
                        continue;

                    var rowInfo = this.$annotations[row] = {
                        text: []
                    };
                    for (var i = 0; i < rowAnnotations.length; i++) {
                        var annotation = rowAnnotations[i];
                        var annoText = annotation.text.replace(/"/g, "&quot;").replace(/'/g, "&#8217;").replace(/</, "&lt;");
                        if (rowInfo.text.indexOf(annoText) === -1)
                            rowInfo.text.push(annoText);
                        var type = annotation.type;
                        if (type == "error")
                            rowInfo.className = "ace_error";
                        else if (type == "warning" && rowInfo.className != "ace_error")
                            rowInfo.className = "ace_warning";
                        else if (type == "info" && (!rowInfo.className))
                            rowInfo.className = "ace_info";
                    }
                }
            }
        },

        update: function(config) {
            this.$config = config;

            var emptyAnno = { className: "", text: [] };
            var html = [];
            var i = config.firstRow;
            var lastRow = config.lastRow;
            var fold = this.session.getNextFoldLine(i);
            var foldStart = fold ? fold.start.row : Infinity;
            var foldWidgets = this.$showFoldWidgets && this.session.foldWidgets;

            while (true) {
                if (i > foldStart) {
                    i = fold.end.row + 1;
                    fold = this.session.getNextFoldLine(i, fold);
                    foldStart = fold ? fold.start.row : Infinity;
                }
                if (i > lastRow)
                    break;

                var annotation = this.$annotations[i] || emptyAnno;
                html.push("<div class='ace_gutter-cell",
                this.$decorations[i] || "",
                this.$breakpoints[i] ? " ace_breakpoint " : " ",
                annotation.className,
                "' title='", annotation.text.join("\n"),
                "' style='height:", config.lineHeight, "px;'>",
                '<span class="ace_debug_arrow {0}" row="{1}"></span>'.format(this.$break === i ? 'background' : '', i),
                (i + 1));

                if (foldWidgets) {
                    var c = foldWidgets[i];
                    if (!c)
                        c = foldWidgets[i] = this.session.getFoldWidget(i);
                    if (c)
                        html.push(
                        "<span class='ace_fold-widget ", c,
                        c == "start" && i == foldStart && i < fold.end.row ? " closed" : " open",
                        "'></span>"
                    );
                }

                var wrappedRowLength = this.session.getRowLength(i) - 1;
                while (wrappedRowLength--) {
                    html.push("</div><div class='ace_gutter-cell' style='height:", config.lineHeight, "px'>\xA6");
                }

                html.push("</div>");

                i++;
            }
            this.element = dom.setInnerHtml(this.element, html.join(""));
            this.element.style.height = config.minHeight + "px";
        },

        $showFoldWidgets: true,
        setShowFoldWidgets: function(show) {
            if (show)
                dom.addCssClass(this.element, "ace_folding-enabled");
            else
                dom.removeCssClass(this.element, "ace_folding-enabled");

            this.$showFoldWidgets = show;
        },
        getShowFoldWidgets: function() {
            return this.$showFoldWidgets;
        }

    });

});
