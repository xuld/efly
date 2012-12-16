

include('ace/mode/Text.js');
include('ace/Tokenizer.js');
include('ace/mode/LatexHighlightRules.js');
include('ace/Range.js');

define(function() {

    var Range = ace.Range;

    Class('ace.mode.Latex', ace.mode.Text, {

        Latex: function() {
            this.$tokenizer = new ace.Tokenizer(new ace.mode.LatexHighlightRules().getRules());
        },

        toggleCommentLines: function(state, doc, startRow, endRow) {
            // This code is adapted from ruby.js
            var outdent = true;
            var outentedRows = [];

            // LaTeX comments begin with % and go to the end of the line
            var commentRegEx = /^(\s*)\%/;

            for (var i = startRow; i <= endRow; i++) {
                if (!commentRegEx.test(doc.getLine(i))) {
                    outdent = false;
                    break;
                }
            }

            if (outdent) {
                var deleteRange = new Range(0, 0, 0, 0);
                for (var i = startRow; i <= endRow; i++) {
                    var line = doc.getLine(i);
                    var m = line.match(commentRegEx);
                    deleteRange.start.row = i;
                    deleteRange.end.row = i;
                    deleteRange.end.column = m[0].length;
                    doc.replace(deleteRange, m[1]);
                }
            }
            else {
                doc.indentRows(startRow, endRow, "%");
            }
        },

        // There is no universally accepted way of indenting a tex document
        // so just maintain the indentation of the previous line
        getNextLineIndent: function(state, line, tab) {
            return this.$getIndent(line);
        }

    });

});
