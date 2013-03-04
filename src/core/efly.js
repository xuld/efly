

var EFly = {

	version: 1.0,

	options: {
		menu: null
	},

	init: function (containerNode, options) {
		
	}

};

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