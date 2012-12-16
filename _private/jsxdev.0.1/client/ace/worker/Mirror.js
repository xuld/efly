
include('ace/Document.js');
include('ace/lib/Lang.js');

define(function() {

    Class('ace.worker.Mirror', null, {

        $timeout: 500,

        Mirror: function() {

            this.doc = new ace.Document('');
            this.deferredUpdate = ace.lib.Lang.deferredCall(this.onUpdate.bind(this));
        },

        //UPDATE
        change: function(data) {

            this.doc.applyDeltas([data]); //UPDATE
            this.deferredUpdate.schedule(this.$timeout);
        },

        setTimeout: function(timeout) {
            this.$timeout = timeout;
        },

        setValue: function(value) {
            this.doc.setValue(value);
            this.deferredUpdate.schedule(this.$timeout);
        },

        getValue: function() {
            return this.doc.getValue();
        },

        onUpdate: function() {
            // abstract method
        }

    });

});