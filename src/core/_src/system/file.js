

ide.registerCommand('efly.file.new', {

	id: 1,

	exec: function (path, showUI) {

		var panel = ide.getPanel(path);

		panel.elem.style.cssText = 'left:0;right:0;bottom:0;top:0';
		panel.elem.innerHTML = 'var a = 3;\r\nasdas;asd=3';
		panel.elem.id = 'editor';

		var editor = ace.edit(panel.elem);
		//editor.setTheme("ace/theme/monokai");
		//editor.getSession().setMode("ace/mode/javascript");

		return ide.openTab(String(Math.random()), path || ("new " + this.id++), "(未保存)", panel);

		//alert('打开文件');
	}

});

ide.registerCommand('efly.file.open', {


});
