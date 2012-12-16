

include('Jsx/Util.js');
include('extjs/ext.js');

define(function() {

    Ext.ns('Ext.theme');
    global.includeCss = function(name) {

        var url = Jsx.format(name);
        if (Ext.get(url))
            return;

        var head = Ext.select('head').item(0);
        var obj = { id: url, tag: 'link', rel: 'stylesheet', href: url, type: 'text/css' };

        head.appendChild(Ext.DomHelper.createDom(obj));
    }

});