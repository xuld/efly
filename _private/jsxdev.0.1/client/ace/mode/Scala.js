
include('ace/mode/JavaScript.js');
include('ace/Tokenizer.js');
include('ace/mode/ScalaHighlightRules.js');

define(function() {

    Class('ace.mode.Scala', ace.mode.JavaScript, {

        Scala: function() {
            this.JavaScript();
            this.$tokenizer = new ace.Tokenizer(new ace.mode.ScalaHighlightRules().getRules());
        },

        createWorker: function(session) {
            return null;
        }


    });


});
