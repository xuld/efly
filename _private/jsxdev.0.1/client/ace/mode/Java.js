
include('ace/mode/JavaScript.js');
include('ace/mode/JavaHighlightRules.js');
include('ace/Tokenizer.js');

define(function() {


    Class('ace.mode.Java', ace.mode.JavaScript, {

        Java: function() {

            this.JavaScript();

            this.$tokenizer = new ace.Tokenizer(new ace.mode.JavaHighlightRules().getRules());

        },

        createWorker: function(session) {
            return null;
        }

    });

});
