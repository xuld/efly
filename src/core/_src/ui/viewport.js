
//#include ide.js
//#include toolbar.js
//#include searchtextbox.js
//#include borderlayoutcontainer.js
//#include statusbar.js

/**
 * 表示一个视图窗口。
 */
var Viewport = Control.extend({

	/**
	 * 搜索框部分。
	 */
	searchTextBox: null,

	/**
	 * 工具条部分。
	 */
	systemMenu: null,

	/**
	 * 主体部分。
	 */
	regions: null,

	/**
	 * 状态栏部分。
	 */
	statusbar: null,

	create: function () {
		var div = document.createElement('div');
		div.innerHTML = '<span class="icon icon-search systemtext"></span><input class="searchtextbox" type="text" placeholder="快速启动" title="输入命令或文件以快速启动...">';
		return div;
	},

	init: function () {

		// 初始化各个控件。

		this.searchTextBox = new SearchTextBox().renderTo(this.elem);
		this.searchTextBox.onSearch = function (text) {
			alert('搜索 ' + text);
		};

		this.systemMenu = new Toolbar().renderTo(this.elem);
		this.regions = new BorderLayoutContainer().renderTo(this.elem);
		this.statusbar = new Statusbar().renderTo(this.elem);

	},

    /**
	 * 根据 options 更新编辑器状态。
	 */
	set: function (configs) {

		//this.configs = configs;

		if (configs.showSystemMenu === false) {
			this.systemMenu.elem.style.display = 'none';
		} else {
			this.systemMenu.elem.style.display = '';
			this.systemMenu.set(configs.systemMenu);
        }

		if (configs.showStatusbar === false) {
			this.statusbar.elem.style.display = 'none';
		} else {
			this.statusbar.elem.style.display = '';
		}

		this.regions.set(configs.regions || {});

		var docSize = Dom.getSize(document);
		this.resizeTo(docSize.x, docSize.y);

	},

	resizeTo: function (width, height) {
		this.statusbar.elem.style.width = width + 'px';
		this.regions.resizeTo(width, height - this.systemMenu.elem.offsetHeight - this.statusbar.elem.offsetHeight);
	}

});
