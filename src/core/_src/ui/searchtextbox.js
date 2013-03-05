

/**
 * 表示一个搜索框。
 */
var SearchTextBox = Control.extend({

	create: function () {
		var div = document.createElement('div');
		div.className = 'right';
		div.innerHTML = '<span class="icon icon-search systemtext"></span><input class="searchtextbox" type="text" placeholder="快速启动" title="输入命令或文件以快速启动...">';
		return div;
	},

	init: function () {
		var me = this,
			input = me.elem.lastChild;
		input.onfocus = input.select;
		input.onkeydown = function (e) {
			if (e.keyCode === 10 || e.keyCode === 13) {
				me.onSearch(input.value);
			}
		};
		me.elem.firstChild.onclick = function (e) {
			me.onSearch(input.value);
		};
	},

	onSearch: Function.empty

});
