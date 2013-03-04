

var EFly = {

	version: 1.0,

	options: {
		menu: null
	},

	init: function (containerNode, options) {
		
	}

};

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