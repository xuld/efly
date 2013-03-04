

var EFly = {

	version: 1.0,

	options: {
		menu: null
	},

	init: function (containerNode, options) {
		
	}

};

/**
 * 表示一个集成开发环境。
 */
var IDE = Class({

	/**
	 * 包含全部内容的跟节点。
	 */
	node: null,

	/**
	 * 当前 IDE 的配置对象。
	 */
	options: null,

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

	/**
	 * 根据 options 更新编辑器状态。
	 */
	update: function (options) {

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


	},
	
	/**
	 * 创建一个面板。
	 */
	createPanel: function (name) {
		
	},

	/**
	 * 改变编辑器容器大小后执行。
	 */
	onResize: function () {
		this.main.resizeTo(this.node.offsetWidth, this.node.offsetHeight - this.toolbar.node.offsetHeight - this.statusbar.node.offsetHeight);
	},

	constructor: function (containerNode, options) {

		// 初始化对象。
		this.node = containerNode;

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

	/**
	 * 在当前 IDE 注册一个命令。
	 */
	registerCommand: function (commandName, commandAction, language, defaultShortcut) {

	},

	/**
	 * 在当前 IDE 注销一个命令。
	 */
	unregisterCommand: function (commandName) {

	},

	/**
	 * 获取指定名字的命令对象。
	 */
	getCommand: function (commandName) {
		
	},

	/**
	 * 在当前 IDE 执行一个命令。
	 */
	execCommand: function (commandName, args) {

	},

	/**
	 * 查询命令的状态。
	 */
	queryCommandState: function (commandName) {

	},

	/**
	 * 查询命令的值。
	 */
	queryCommandValue: function (commandName) {

	},

	/**
	 * 获取指定名字的菜单。
	 */
	getMenu: function (menuName) {

	},

	/**
	 * 在当前 IDE 注册一个面板。
	 */
	registerPanel: function (panelName, panelClass) {

	},

	/**
	 * 在当前 IDE 注销一个面板。
	 */
	unregisterPanel: function (panelName, panelClass) {

	},

	/**
	 * 获取指定名字的面板。
	 */
	getPanel: function (panelName, createIfNotExisit) {

	},

	/**
	 * 注册一个键盘事件。
	 */
	registerKey: function (keyName, language, command) {

	},

	/**
	 * 注销一个键盘事件。
	 */
	unregisterKey: function (keyName) {

	},

	/**
	 * 注册一个插件。
	 */
	registerPlugin: function (pluginObject) {

	},

	/**
	 * 注销一个插件。
	 */
	unregisterPlugin: function (pluginObject) {

	}

});

/**
 * 表示一个搜索框。
 */
var SearchTextBox = Control.extend({

	create: function () {
		var div = document.createElement('div');
		div.innerHTML = '<span class="icon icon-search systemtext"></span><input class="searchtextbox" type="text" placeholder="快速启动" title="输入命令或文件以快速启动...">';
		return div;
	},

	init: function () {
		var me = this,
			input = this.node.lastChild;
		input.onfocus = input.node.select;
		input.onkeydown = function (e) {
			me.onSearch(this.value);
		};
		this.node.firstChild.onclick = function (e) {
			me.onSearch(me.node.lastChild.value);
		};
	},

	onSearch: Function.empty

});

/**
 * 表示一个状态栏。
 */
var Statusbar = Control.extend({

	tpl: '<div class="statusbar">\
				<div class="right">\
					<span class="statusbar-label"></span>\
					<span class="statusbar-label"></span>\
					<span class="statusbar-label"></span>\
					<span class="statusbar-info"></span>\
				</div>\
				<span class="statusbar-text"></span>\
			</div>',

	constructor: function () {
		
	},

	updateStatusText: function (value) {

	},

	updateRowInfo: function (row, col, selectionLength) {

	}
});

/**
 * 表示一个工具框。
 */
var Toolbar = Control.extend({

	create: function () {
		var div = document.createElement('div');
		div.className = 'toolbar systemtext';
		return div;
	},

	init: function () {
	},

	// 根据 items 重新生成菜单项。 
	update: function (options) {

	}

});


/**
 * 表示一个面板。
 */
var Panel = Control.extend({

	/**
	 * 当前面板的所在 IDE。
	 */
	owner: null,

	/**
	 * 当前面板的标题。
	 */
	title: null,

	create: function () {
		return document.createElement('div');
	},

	/**
	 * 根据 options 更新面板状态。
	 */
	update: function (options) {

	},

	/**
	 * 更改当前面板的大小。
	 */
	resizeTo: function (width, height) {

	}




});


/**
 * 表示一个边框布局的容器。
 */
var BorderLayoutContainer = Control.extend({

	left: null,

	center: null,

	right: null,

	bottom: null,

	create: function () {
		var div = document.createElement('div');
		div.className = 'relative';
		return div;
	},

	init: function () {
		var Region = BorderLayoutContainer.Region;

		this.left = new Region(this, 'left');
		this.center = new Panel().addClass('absolute').appendTo(this);
		this.right = new Region(this, 'right');
		this.bottom = new Region(this, 'bottom');
	},

	/**
	 * 更改当前面板的大小。
	 */
	resizeTo: function (width, height) {
		this.node.style.width = width + 'px';
		this.node.style.height = height + 'px';
	},

	/**
	 * 在指定的区域增加一个面板。
	 */
	add: function (region, panel) {

	},

	/**
	 * 更新当前容器的布局状态。
	 */
	updateLayout: function () {

	}

});



/**
 * 表示边框布局容器中的一个区域。
 */
BorderLayoutContainer.Region = Control.extend({

	owner: null,

	constructor: function (container, name) {
		this.owner = container;
		this.name = name;
		this.panels = [];

		this.node = document.createElement('div');
		this.node.className = 'absolute';
		container.append(this.node);

	},

	/**
	 * 折叠当前区域。
	 */
	collapse: function () {

	},

	/**
	 * 展开当前区域。
	 */
	expand: function () {

	}

});


/**
 * 表示一个选项卡控件。
 */
var TabControl = Control.extend({

	constructor: function (container) {

	}

});

/**
 * 表示一个命令。
 */
var Command = Class({

	name: null,

	exec: Function.empty,

	state: null,

	shortcut: null,

	constructor: function (name, action, state) {

	}

});