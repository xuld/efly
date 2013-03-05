

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

		this.elem = document.createElement('div');
		this.elem.className = 'absolute';
		container.append(this.elem);

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
