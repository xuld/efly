
/**
 * 表示一个搜索框。
 */
var ViewPort = Control.extend({

	/**
	 * 当前 IDE 的搜索框部分。
	 */
	searchTextBox: null,

	/**
	 * 当前 IDE 的工具条部分。
	 */
	toolbar: null,

	/**
	 * 当前 IDE 的主体部分。
	 */
	main: null,

	/**
	 * 当前 IDE 的状态栏部分。
	 */
	statusbar: null,

	/**
	 * 当前已打开的选项卡。
	 */
	tabs: null,

	/**
	 * 当前已打开的面板。
	 */
	panels: null,

	create: function () {
		var div = document.createElement('div');
		div.innerHTML = '<span class="icon icon-search systemtext"></span><input class="searchtextbox" type="text" placeholder="快速启动" title="输入命令或文件以快速启动...">';
		return div;
	},

	init: function () {

		// 初始化各个控件。

		this.searchTextBox = new SearchTextBox().addClass('right').appendTo(containerNode);
		this.searchTextBox.onSearch = function (text) {
			alert('搜索 ' + text);
		};

		this.toolbar = new Toolbar().appendTo(containerNode);
		this.main = new BorderLayoutContainer().appendTo(containerNode);
		this.statusbar = new Statusbar().appendTo(containerNode);

		this.tabs = new TabControl(this.main.center);
		this.panels = {};

		// 应用配置。
		this.update(options);
	},

	onSearch: Function.empty

});
