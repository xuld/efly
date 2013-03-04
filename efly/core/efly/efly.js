

var EFly = {

	version: 1.0,

	options: {
		menu: null
	},

	init: function (containerNode, options) {
		
	}

};

/**
 * ��ʾһ�����ɿ���������
 */
var IDE = Class({

	/**
	 * ����ȫ�����ݵĸ��ڵ㡣
	 */
	node: null,

	/**
	 * ��ǰ IDE �����ö���
	 */
	options: null,

	/**
	 * ��ǰ IDE �������򲿷֡�
	 */
	searchTextBox: null,

	/**
	 * ��ǰ IDE �Ĺ��������֡�
	 */
	toolbar: null,

	/**
	 * ��ǰ IDE �����岿�֡�
	 */
	main: null,

	/**
	 * ��ǰ IDE ��״̬�����֡�
	 */
	statusbar: null,

	/**
	 * ��ǰ�Ѵ򿪵�ѡ���
	 */
	tabs: null,

	/**
	 * ��ǰ�Ѵ򿪵���塣
	 */
	panels: null,

	/**
	 * ���� options ���±༭��״̬��
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

			// ���������û�д��������򴴽�һ����
			if (!this.panels[panel]) {
				this.panels[panel] = this.createPanel(panel);
			}

			// �����������á�
			this.panels[panel].update(options.panels[panel]);
		}


	},
	
	/**
	 * ����һ����塣
	 */
	createPanel: function (name) {
		
	},

	/**
	 * �ı�༭��������С��ִ�С�
	 */
	onResize: function () {
		this.main.resizeTo(this.node.offsetWidth, this.node.offsetHeight - this.toolbar.node.offsetHeight - this.statusbar.node.offsetHeight);
	},

	constructor: function (containerNode, options) {

		// ��ʼ������
		this.node = containerNode;

		// ��ʼ�������ؼ���
		
		this.searchTextBox = new SearchTextBox().addClass('right').appendTo(containerNode);
		this.searchTextBox.onSearch = function (text) {
			alert('���� ' + text);
		};

		this.toolbar = new Toolbar().appendTo(containerNode);
		this.main = new BorderLayoutContainer().appendTo(containerNode);
		this.statusbar = new Statusbar().appendTo(containerNode);

		this.tabs = new TabControl(this.main.center);
		this.panels = {};

		// Ӧ�����á�
		this.update(options);
	},

	/**
	 * �ڵ�ǰ IDE ע��һ�����
	 */
	registerCommand: function (commandName, commandAction, language, defaultShortcut) {

	},

	/**
	 * �ڵ�ǰ IDE ע��һ�����
	 */
	unregisterCommand: function (commandName) {

	},

	/**
	 * ��ȡָ�����ֵ��������
	 */
	getCommand: function (commandName) {
		
	},

	/**
	 * �ڵ�ǰ IDE ִ��һ�����
	 */
	execCommand: function (commandName, args) {

	},

	/**
	 * ��ѯ�����״̬��
	 */
	queryCommandState: function (commandName) {

	},

	/**
	 * ��ѯ�����ֵ��
	 */
	queryCommandValue: function (commandName) {

	},

	/**
	 * ��ȡָ�����ֵĲ˵���
	 */
	getMenu: function (menuName) {

	},

	/**
	 * �ڵ�ǰ IDE ע��һ����塣
	 */
	registerPanel: function (panelName, panelClass) {

	},

	/**
	 * �ڵ�ǰ IDE ע��һ����塣
	 */
	unregisterPanel: function (panelName, panelClass) {

	},

	/**
	 * ��ȡָ�����ֵ���塣
	 */
	getPanel: function (panelName, createIfNotExisit) {

	},

	/**
	 * ע��һ�������¼���
	 */
	registerKey: function (keyName, language, command) {

	},

	/**
	 * ע��һ�������¼���
	 */
	unregisterKey: function (keyName) {

	},

	/**
	 * ע��һ�������
	 */
	registerPlugin: function (pluginObject) {

	},

	/**
	 * ע��һ�������
	 */
	unregisterPlugin: function (pluginObject) {

	}

});

/**
 * ��ʾһ��������
 */
var SearchTextBox = Control.extend({

	create: function () {
		var div = document.createElement('div');
		div.innerHTML = '<span class="icon icon-search systemtext"></span><input class="searchtextbox" type="text" placeholder="��������" title="����������ļ��Կ�������...">';
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
 * ��ʾһ��״̬����
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
 * ��ʾһ�����߿�
 */
var Toolbar = Control.extend({

	create: function () {
		var div = document.createElement('div');
		div.className = 'toolbar systemtext';
		return div;
	},

	init: function () {
	},

	// ���� items �������ɲ˵�� 
	update: function (options) {

	}

});


/**
 * ��ʾһ����塣
 */
var Panel = Control.extend({

	/**
	 * ��ǰ�������� IDE��
	 */
	owner: null,

	/**
	 * ��ǰ���ı��⡣
	 */
	title: null,

	create: function () {
		return document.createElement('div');
	},

	/**
	 * ���� options �������״̬��
	 */
	update: function (options) {

	},

	/**
	 * ���ĵ�ǰ���Ĵ�С��
	 */
	resizeTo: function (width, height) {

	}




});


/**
 * ��ʾһ���߿򲼾ֵ�������
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
	 * ���ĵ�ǰ���Ĵ�С��
	 */
	resizeTo: function (width, height) {
		this.node.style.width = width + 'px';
		this.node.style.height = height + 'px';
	},

	/**
	 * ��ָ������������һ����塣
	 */
	add: function (region, panel) {

	},

	/**
	 * ���µ�ǰ�����Ĳ���״̬��
	 */
	updateLayout: function () {

	}

});



/**
 * ��ʾ�߿򲼾������е�һ������
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
	 * �۵���ǰ����
	 */
	collapse: function () {

	},

	/**
	 * չ����ǰ����
	 */
	expand: function () {

	}

});


/**
 * ��ʾһ��ѡ��ؼ���
 */
var TabControl = Control.extend({

	constructor: function (container) {

	}

});

/**
 * ��ʾһ�����
 */
var Command = Class({

	name: null,

	exec: Function.empty,

	state: null,

	shortcut: null,

	constructor: function (name, action, state) {

	}

});