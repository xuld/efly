
include('ace/mode/JavaScript.js');
include('ace/mode/GroovyHighlightRules.js');
include('ace/Tokenizer.js');

define(function() {

    Class('ace.mode.Groovy', ace.mode.JavaScript, {

        Groovy: function() {
            this.JavaScript();
            this.$tokenizer = new ace.Tokenizer(new ace.mode.GroovyHighlightRules().getRules());
        },

        createWorker: function(session) {
            return null;
        }

    });

});
