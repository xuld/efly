
include('ace/mode/TextHighlightRules.js');

define(function() {

    Class('ace.mode.LatexHighlightRules', ace.mode.TextHighlightRules, {

        LatexHighlightRules: function() {


            this.$rules = {
                "start": [{
                    // A tex command e.g. \foo
                    token: "keyword",
                    regex: "\\\\(?:[^a-zA-Z]|[a-zA-Z]+)"
                }, {
                    // Curly and square braces
                    token: "lparen",
                    regex: "[[({]"
                }, {
                    // Curly and square braces
                    token: "rparen",
                    regex: "[\\])}]"
                }, {
                    // Inline math between two $ symbols
                    token: "string",
                    regex: "\\$(?:(?:\\\\.)|(?:[^\\$\\\\]))*?\\$"
                }, {
                    // A comment. Tex comments start with % and go to 
                    // the end of the line
                    token: "comment",
                    regex: "%.*$"
                }
                ]
            };

        }

    });

});
