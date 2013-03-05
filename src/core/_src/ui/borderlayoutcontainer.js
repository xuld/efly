

//#include ide.js
//#include tabcontrol.js

/**
 * 表示一个边框布局的容器。
 */
var BorderLayoutContainer = Control.extend({

	left: null,

	center: null,

	right: null,

	bottom: null,

	borderWidth: 10,

	create: function () {
		var div = document.createElement('div');
		div.className = 'relative';
		return div;
	},

	init: function () {
		var Region = BorderLayoutContainer.Region;

		this.left = new Region(this, 'left');
		//this.center = new Panel().addClass('absolute').appendTo(this);
		this.right = new Region(this, 'right');
		this.bottom = new Region(this, 'bottom');

		this.center = new TabControl().renderTo(this.elem);
		this.center.elem.className = 'absolute';
		this.center.elem.style.top = 0;
	},

	regionDefaultConfigs: {
		panels: [],
		collspaned: true
	},

	set: function (regions) {
		this.borderWidth = regions.borderWidth,
		this.left.set(regions.left || this.regionDefaultConfigs);
		this.right.set(regions.right || this.regionDefaultConfigs);
		this.bottom.set(regions.bottom || this.regionDefaultConfigs);
	},

	resizeTo: function (width, height) {

		// 设置容器尺寸。
		var style = this.elem.style;
		style.width = width + 'px';
		style.height = height + 'px';

		// 设置中心区域的大小。
		this.center.elem.style.left = this.left.elem.offsetWidth + this.borderWidth + 'px';
		this.center.resizeTo(width - this.left.elem.offsetWidth - this.right.elem.offsetWidth - this.borderWidth - this.borderWidth, height - this.bottom.elem.offsetHeight - this.borderWidth);

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

	vertical: false,

	constructor: function (container, name) {
		this.owner = container;
		this.name = name;
		this.panels = {};
		this.vertical = name === 'bottom';

		this.elem = document.createElement('div');
		this.elem.className = 'absolute';

		this.elem.style[this.vertical ? 'left' : 'top'] = this.elem.style[name] = 0;

		this.renderTo(container.elem);

	},

	set: function (configs) {

		this.elem.style.width = this.elem.style.height = '100%';

		// 如果是折叠状态，只显示标题。
		if (configs.collspaned === true || !configs.currentPanel) {

			var html = ['<div class="systemtext nav nav-', this.name, '">'];

			for(var i = 0; i < configs.panels.length; i++) {
				html.push('<div class="item" data-key="', configs.panels[i], '">', ide.getPanelName(configs.panels[i]).replace(/\n/g, this.vertical ? "" : "<br>"), '</div>');
			}
			
			html.push('</div>');

			this.elem.innerHTML = html.join('');

			if (this.vertical) {
				this.elem.style.height = '25px';
			} else {
				this.elem.style.width = '25px';
			}

		} else {

			var html = ['<div class="systemtext nav-', this.name, '">'];

			for(var i = 0; i < configs.panels.length; i++) {
				html.push('<a class="toolbar-button" data-key="', configs.panels[i], '">', ide.getPanelName(configs.panels[i]), '</div>', '<span class="toolbar-splitter"></span>');
			}

			html[html.length - 1] = '</div>';

			this.elem.innerHTML = html.join('');

			this.elem.insertBefore(ide.getPanel(configs.currentPanel).elem, this.elem.firstChild);

			if (this.vertical) {
				this.elem.style.height = configs.height + 'px';
			} else {
				this.elem.style.width = configs.width + 'px';
			}

		}

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

var DockPanel = Panel.extend({

	/**
	 * 当前面板的标题。
	 */
	title: null,

	constructor: function (title, content) {

		this.elem = document.createElement('div');
		this.elem.className = 'panel';
		this.elem.innerHTML = '<div class="panel-header"><span class="right icon icon-cancel-3"></span>' + title + '</div>';

		this.title = title;
		this.header = this.elem.firstChild;
		this.content = content;

		Dom.append(this.content, content);

	}

});
