

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

		var innerHeight = height - this.bottom.elem.offsetHeight - this.borderWidth;

		// 设置中心区域的大小。
		this.center.elem.style.left = this.left.elem.offsetWidth + this.borderWidth + 'px';
		this.center.resizeTo(width - this.left.elem.offsetWidth - this.right.elem.offsetWidth - this.borderWidth - this.borderWidth, innerHeight);

		// 设置边框区域的大小。
		this.left.elem.style.height = this.right.elem.style.height = innerHeight + 'px';
		this.bottom.elem.style.width = width + 'px';

		this.left.update();
		this.right.update();
		this.bottom.update();

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

	selectedPanel: null,

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
		if (configs.collspaned === true || !configs.selectedPanel) {

			var html = ['<div class="systemtext nav nav-', this.name, '">'];

			for(var i = 0; i < configs.panels.length; i++) {
				html.push('<div class="item" data-key="', configs.panels[i], '">', ide.getPanelName(configs.panels[i]).replace(/\n/g, this.vertical ? "" : "<br>"), '</div>');
			}
			
			html.push('</div>');

			this.elem.innerHTML = html.join('');

			if (this.vertical) {
				this.elem.style.height = '29px';
			} else {
				this.elem.style.width = '25px';
			}

		} else {

			html.push('<div class="panel-header"><span class="right icon icon-cancel-3"></span>' + ide.getPanelName(configs.selectedPanel) + '</div><div class="panel-body"></div>');

			var html = ['<div class="systemtext nav-', this.name, '">'];

			for(var i = 0; i < configs.panels.length; i++) {
				html.push('<a class="toolbar-button" data-key="', configs.panels[i], '">', ide.getPanelName(configs.panels[i]), '</div>', '<span class="toolbar-splitter"></span>');
			}

			html[html.length - 1] = '</div>';

			this.elem.innerHTML = html.join('');

			var panel = ide.getPanel(configs.selectedPanel);

			panel.renderTo(this.elem.firstChild.nextSibling);

			if (panel.onShow) {
				panel.onShow();
			}

			if (this.vertical) {
				this.elem.style.height = configs.height + 'px';
			} else {
				this.elem.style.width = configs.width + 'px';
			}

		}

	},

	update: function () {
		if (this.selectedPanel) {
			var panelBody = this.selectedPanel.elem.parentNode;
			panelBody.style.width = this.elem.offsetWidth + 'px';
			panelBody.style.height = this.elem.offsetHeight - panelBody.previousSibling.offsetHeight + 'px';
			if (this.selectedPanel.onResize) {
				this.selectedPanel.onResize();
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
