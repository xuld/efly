
//#include ide.js
//#include toolbar.js
//#include searchtextbox.js
//#include borderlayoutcontainer.js
//#include statusbar.js

/**
 * 表示一个搜索框。
 */
var ViewPort = Control.extend({

	/**
	 * 搜索框部分。
	 */
	searchTextBox: null,

	/**
	 * 工具条部分。
	 */
	toolbar: null,

	/**
	 * 主体部分。
	 */
	main: null,

	/**
	 * 状态栏部分。
	 */
	statusbar: null,

	///**
	// * 当前已打开的选项卡。
	// */
	//tabs: null,

	///**
	// * 当前已打开的面板。
	// */
	//panels: null,

	create: function () {
		var div = document.createElement('div');
		div.innerHTML = '<span class="icon icon-search systemtext"></span><input class="searchtextbox" type="text" placeholder="快速启动" title="输入命令或文件以快速启动...">';
		return div;
	},

	init: function (options) {

		// 初始化各个控件。

		this.searchTextBox = new SearchTextBox().renderTo(this.elem);
		this.searchTextBox.onSearch = function (text) {
			alert('搜索 ' + text);
		};

		this.toolbar = new Toolbar().renderTo(this.elem);
		this.main = new BorderLayoutContainer().renderTo(this.elem);
		this.statusbar = new Statusbar().renderTo(this.elem);

		//this.tabs = new TabControl(this.main.center);
		//this.panels = {};

		// 应用配置。
		this.update(options);
	},

    /**
	 * 根据 options 更新编辑器状态。
	 */
	update: function (options) {

		return

        this.options = options;

        if (options.toolbar === false) {
            this.toolbar.hide();
        } else {
            this.toolbar.update(options.menu);
        }

        if (options.statusbar === false) {
            this.statusbar.hide();
        }

        this.onResize();

        for (var panel in options.panels) {

            // 如果这个面板没有创建过，则创建一个。
            if (!this.panels[panel]) {
                this.panels[panel] = this.createPanel(panel);
            }

            // 更新面板的配置。
            this.panels[panel].update(options.panels[panel]);
        }


    }

});
