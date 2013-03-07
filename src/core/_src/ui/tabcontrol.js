

/**
 * 表示一个选项卡控件。
 */
var TabControl = Control.extend({

	tabbable: null,

	body: null,

	selectedTab: null,

	create: function () {
		return document.createElement('div');
	},

	init: function (container) {

		this.elem.innerHTML = '<div class="tabbable systemtext"><a class="right icon icon-bottom tab-list"></a><div class="tabs"><div class="tab "><a class="icon icon-plus tab-add" href="#"></a></div></div></div><div class="tabpages"></div>';

		this.tabbable = this.elem.firstChild.firstChild.nextSibling;
		this.body = this.elem.lastChild;

		this.tabs = {};
		this.tabStack = [];

		Dom.on(this.tabbable, 'click', function (e) {
			var target = e.target,
				isClose = Dom.hasClass(target, 'tab-close'),
				id;

			if ((target = Dom.closest(target, '.tab')) && (id = target.getAttribute('data-key'))) {
				if (isClose) {
					this.removeTab(id);
				} else {
					this.selectTab(id);
				}
			}

		}, this);

		Dom.on(this.tabbable, 'mousedown', function (e) {
			var target = e.target;
			if (e.which === 2 && (target = Dom.closest(target, '.tab'))) {
				this.removeTab(target.getAttribute('data-key'));
			}

		}, this);

		Dom.on(this.tabbable.lastChild, 'click', this.addEmptyTab, this);
		
	},

	/**
	 * 激活指定的选项卡。
	 */
	selectTab: function (id) {

		if (this.selectedTab !== id) {
			
			var tab;

			// 取消激活当前选项卡。
			
			if (tab = this.tabs[this.selectedTab]) {
				Dom.removeClass(tab.header, 'tab-actived');

				if (tab.panel.onHide) {
					tab.panel.onHide();
				}

				tab.panel.remove();
			}

			if (tab = this.tabs[id]) {

				this.tabStack.remove(id);
				this.tabStack.push(id);

				tab.panel.renderTo(this.body);

				if (tab.panel.onShow) {
					tab.panel.onShow();
				}

				// 如果 tab 的标题未显示在 tabs 中，则插入标题。
				if (!tab.header.parentNode) {

					var tabbable = this.tabbable,
						minHeight = tabbable.offsetHeight,
						c;

					tabbable.insertBefore(tab.header, tabbable.lastChild);

					// 如果新插入的标签导致 TAB 换行了，则删除之前的标签。
					while (tabbable.offsetHeight > minHeight) {
						c = tabbable.removeChild(tabbable.firstChild);
					}

					// 插入标题的特效。
					if (ide.configs.fx !== false) {
						
						if (c) {
							tab.header.style.display = 'none';
							tabbable.insertBefore(c, tabbable.firstChild);
							Dom.animate(c, { width: c.offsetWidth + '-0' }, -1, function () {
								c.style.width = '';
								tabbable.removeChild(c);
								tab.header.style.display = '';
							});
						} else {
							Dom.animate(tab.header, { width: '0-' + tab.header.offsetWidth });
						}
					}

				}

				Dom.addClass(tab.header, 'tab-actived');

			}

			// 更新新的选项卡。
			this.selectedTab = id;

		}

	},

	addEmptyTab: function () {
		return ide.execCommand('efly.file.new');
		//return this.addTab('adgdsdf42323' + Math.random(), 'asd22222222224324234234234234234234' + Math.random(), 'dasdas', ide.getPanel('asdasd'));
	},

	addTab: function (id, name, title, panel) {

		var tab = this.tabs[id];

		if (!tab) {

			var header = document.createElement('div');
			header.className = 'tab panel-header';
			header.title = title;
			header.setAttribute('data-key', id);
			header.innerHTML = name + '<a class="icon right icon-cancel tab-close" href="#" title="' + ide.lang.close + '"></a>';

			this.tabs[id] = tab = {
				id: id,
				header: header,
				panel: panel
			};

		} else if (tab.panel === panel) {
			tab.panel.remove();
			panel.renderTo(this.body);
			tab.panel = panel;
		}

		this.selectTab(id);

		return tab;
	},

	removeTab: function (id) {

		var tab = this.tabs[id];

		if (tab) {

			for (var i = this.tabStack.length - 1; i >= 0; i--) {
				if (this.tabStack[i] === id) {
					this.tabStack.splice(i, 1);
					break;
				}
			}

			if (tab.header.parentNode) {

				var tabbable = this.tabbable,
					minHeight = tabbable.offsetHeight,
					th,
					c;

				for (c = this.tabStack.length - 1; c >= 0; c--) {
					if (!this.tabs[this.tabStack[c]].header.parentNode) {
						break;
					}
				}

				if (ide.configs.fx !== false) {

					// 如果有未显示的标签，则慢慢显示以前的标签。
					if (c >= 0) {
						Dom.remove(tab.header);

						var list = [];

						for (; c >= 0; c--) {
							th = this.tabs[this.tabStack[c]].header;
							tabbable.insertBefore(th, tabbable.firstChild);
							if (tabbable.offsetHeight > minHeight) {
								tabbable.removeChild(th);
								break;
							}
							list.push(th);
						}

						for (var i = 0; i < list.length; i++) {
							Dom.animate(list[i], { width: '0-' + list[i].offsetWidth }, -1);
						}
					} else {
						Dom.animate(tab.header, { width: tab.header.offsetWidth + '-0' }, -1, function () {
							Dom.remove(tab.header);
						});
					}

				} else {
					Dom.remove(tab.header);

					for (; c >= 0; c--) {
						th = this.tabs[this.tabStack[c]].header;
						tabbable.insertBefore(th, tabbable.firstChild);
						if (tabbable.offsetHeight > minHeight) {
							tabbable.removeChild(th);
							break;
						}
					}

				}

			}

			if (this.selectedTab === id) {
				this.selectTab(this.tabStack[this.tabStack.length - 1] || '');
			}

			delete this.tabs[id];
		}

		return tab;

	},

	resizeTo: function (width, height) {
		this.elem.style.width = this.body.style.width = width + 'px';
		this.body.style.height = height - this.tabbable.parentNode.offsetHeight + 'px';

		if (this.selectedTab) {
			this.selectedTab.resizeTo(width, height);
		}
	}

});
