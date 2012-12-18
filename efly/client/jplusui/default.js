




var Menu = TreeControl.extend({

	xtype: 'menu',

	showDuration: null,

	/**
	 * ��ʾ��ǰ�˵��Ƿ�Ϊ�����Ĳ˵��� 
	 */
	floating: false,

	createTreeItem: function (childControl) {

		if (!(childControl instanceof MenuItem)) {

			// ������ı���
			if (childControl.node.nodeType === 3) {

				// - => MenuSeperator
				if (/^\s*-\s*$/.test(childControl.getText())) {

					childControl.remove();

					childControl = new MenuSeperator;

					// ���� => ��ӵ� MenuItem
				} else {

					// ����ԭ�� childControl ��
					var t = childControl;
					childControl = new MenuItem;
					childControl.append(t);
				}
			} else if (childControl.hasClass('x-menuseperator')) {
				childControl = new MenuSeperator(childControl);
			} else {

				// ������Ӧ�� MenuItem ��
				childControl = new MenuItem(childControl);
			}

		}

		return childControl;

	},

	init: function () {

		// �󶨽ڵ�Ϳؼ������㷢���¼��󣬸����¼�Դ�õ��ؼ���
		this.dataField().control = this;

		// �������е� DOM �ṹ��ʼ���˵���
		TreeControl.prototype.init.call(this);
	},

	show: function () {
		Dom.prototype.show.call(this, arguments, {
			duration: this.showDuration
		});

		// ����˵��Ǹ����ģ�������رղ˵�������ֻ�ر��Ӳ˵���
		if (this.floating)
			document.once('mouseup', this.hide, this);
		this.trigger('show');
		return this;
	},

	/**
	 * �رձ��˵���
	 */
	hide: function () {
		Dom.prototype.hide.call(this, arguments, {
			duration: this.showDuration
		});

		// �ȹر��Ӳ˵���
		this.hideSubMenu();
		this.trigger('hide');
		return this;
	},

	/**
	 * ��ǰ�˵�����ĳ���ؼ���ʾ��
	 * @param {Control} ctrl ����
	 */
	showAt: function (x, y) {

		// ȷ���˵�����ӵ��ĵ��ڡ�
		if (!this.closest('body')) {
			this.appendTo();
		}

		// ��ʾ�ڵ㡣
		this.show();

		this.setPosition(x, y);

		return this;
	},

	/**
	 * ��ǰ�˵�����ĳ���ؼ���ʾ��
	 * @param {Control} ctrl ����
	 */
	showBy: function (ctrl, pos, offsetX, offsetY, enableReset) {

		// ȷ���˵�����ӵ��ĵ��ڡ�
		if (!this.closest('body')) {
			this.appendTo(ctrl.parent());
		}

		// ��ʾ�ڵ㡣
		this.show();

		this.pin(ctrl, pos || 'r', offsetX != null ? offsetX : -5, offsetY != null ? offsetY : -5, enableReset);

		return this;
	},

	/**
	 * ��ʾָ������Ӳ˵���
	 * @param {MenuItem} menuItem �Ӳ˵��
	 * @protected
	 */
	showSubMenu: function (menuItem) {

		// ��������Ҽ��Ĳ˵����ڴ��Ӳ˵��������������رմ��Ӳ˵���
		if (!this.floating)
			document.once('mouseup', this.hideSubMenu, this);

		// ���ص�ǰ���Ӳ˵���
		this.hideSubMenu();

		// ����
		menuItem.state("hover", true);

		// ���ָ����������Ӳ˵���
		if (menuItem.subControl) {

			// ���õ�ǰ������
			this.currentSubMenu = menuItem;

			// ��ʾ�Ӳ˵���
			menuItem.subControl.showBy(menuItem);

		}

	},

	/**
	 * �رձ��˵��򿪵��Ӳ˵���
	 * @protected
	 */
	hideSubMenu: function () {

		// ������Ӳ˵��������ء�
		if (this.currentSubMenu) {

			// �ر��Ӳ˵���
			this.currentSubMenu.subControl.hide();

			// ȡ������˵���
			this.currentSubMenu.state("hover", false);
			this.currentSubMenu = null;
		}

	}

});



/**
 * ��ʾ�˵�� 
 */
var MenuItem = TreeControl.Item.extend({

	xtype: 'menuitem',

	/**
	 * ����������дʱ�����ڴ���������
	 * @param {TreeControl} treeControl Ҫ��ʼ����������
	 * @return {TreeControl} �µ� {@link TreeControl} ����
	 * @protected override
	 */
	createSubControl: function (treeControl) {
		return new Menu(treeControl);
	},

	/**
	 * ����������дʱ�����ڳ�ʼ��������
	 * @param {TreeControl} treeControl Ҫ��ʼ����������
	 * @protected override
	 */
	initSubControl: function (treeControl) {
		treeControl.hide();
		treeControl.floating = false;
		this.prepend('<i class="x-menuitem-arrow"></i>');
		this.on('mouseup', this._cancelHideMenu);
	},

	/**
	 * ����������дʱ������ɾ����ʼ��������
	 * @param {TreeControl} treeControl Ҫɾ����ʼ����������
	 * @protected override
	 */
	uninitSubControl: function (treeControl) {
		treeControl.floating = true;
		this.remove('x-menuitem-arrow');
		this.un('mouseup', this._cancelHideMenu);
	},

	onMouseOver: function () {
		this.state("hover", true);
		if (this.subControl)
			this.showSubMenu();
		else if (this.parentControl)
			this.parentControl.hideSubMenu();
	},

	onMouseOut: function () {

		// û�Ӳ˵�����Ҫ��ȡ�����
		// �����ɸ��˵�ȡ����ǰ�˵���״̬��
		// ��Ϊ������Ӳ˵����������Ӳ˵��رպ���ܹرռ��

		if (!this.subControl)
			this.state("hover", false);

	},

	/**
	 *
	 */
	init: function () {
		if (this.hasClass('x-' + this.xtype)) {
			this.unselectable();
			this.on('mouseover', this.onMouseOver);
			this.on('mouseout', this.onMouseOut);
		}
	},

	_cancelHideMenu: function (e) {
		e.stopPropagation();
	},

	_hideTargetMenu: function (e) {
		var tg = e.relatedTarget;
		while (tg && !Dom.hasClass(tg, 'x-menu')) {
			tg = tg.parentNode;
		}

		if (tg) {
			new Dom(tg).dataField().control.hideSubMenu();
		}

	},

	getSubMenu: TreeControl.Item.prototype.getSubControl,

	setSubMenu: TreeControl.Item.prototype.setSubControl,

	showSubMenu: function () {

		// ʹ�ø��˵��򿪱��˵�����ʾ�Ӳ˵���
		this.parentControl && this.parentControl.showSubMenu(this);

		return this;
	},

	hideSubMenu: function () {

		// ʹ�ø��˵��򿪱��˵�����ʾ�Ӳ˵���
		this.parentControl && this.parentControl.hideSubMenu(this);

		return this;
	}

});

var MenuSeperator = MenuItem.extend({

	tpl: '<div class="x-menuseperator"></div>',

	init: Function.empty

});



var Toolbar = Control.extend({

	items: null,

	init: function (options) {
		this.items = options.items;

		this.update();
	},

	// ���� items �������ɲ˵�� 
	update: function () {

	}

});


