
include('ace/mode/Text.js');
include('ace/Tokenizer.js');
include('ace/mode/CSharpHighlightRules.js');
include('ace/mode/MatchingBraceOutdent.js');
include('ace/mode/behaviour/CstyleBehaviour.js');
include('ace/mode/folding/Cstyle.js');

define(function() {

    Class('ace/mode/CSharp', ace.mode.Text, {

        CSharp: function() {
            this.$tokenizer = new ace.Tokenizer(new ace.mode.CSharpHighlightRules().getRules());
            this.$outdent = new ace.mode.MatchingBraceOutdent();
            this.$behaviour = new ace.mode.behaviour.CstyleBehaviour();
            this.foldingRules = new ace.mode.folding.Cstyle();
        },

        getNextLineIndent: function(state, line, tab) {
            var indent = this.$getIndent(line);

            var tokenizedLine = this.$tokenizer.getLineTokens(line, state);
            var tokens = tokenizedLine.tokens;

            if (tokens.length && tokens[tokens.length - 1].type == "comment") {
                return indent;
            }

            if (state == "start") {
                var match = line.match(/^.*[\{\(\[]\s*$/);
                if (match) {
                    indent += tab;
                }
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
            return null;
        }

    });

});
