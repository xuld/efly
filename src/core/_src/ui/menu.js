
//#include ide.js

var Menu = Control.extend({

    create: function () {
        var node = document.createElement('ul');
        node.className = 'dropdown menu systemtext';
        return node;
    },

    init: function () {
        this.itemOn('mouseover', function (item, e) {
            
            // 隐藏之前的项。
            if (this.currentMenu) {
                this.currentMenu.className = '';

                // 同时隐藏子菜单。
                this.hideSubMenu();
            }

            // 设置新的项。
            this.currentMenu = item;

            // 高亮选中项。
            item.className = 'menu-hover';

            this.showSubMenu(item);

        }, this);

        this.itemOn('click', this.clickItem, this);
    },

    itemOn: function (type, fn, thisArgs) {
        Dom.on(this.elem, type, function (e) {
            var li = e.target;
            while (li && li.tagName !== 'LI') {
                li = li.parentNode;
            }

            if (li) {
                return fn.call(this, li, e);
            }
        }, thisArgs);
    },

    showAt: function (p) {
        this.show();
        Dom.setPosition(this.elem, p);
    },

    showBy: function (target, type, offsetX, offsetY) {
        this.show();
        Dom.pin(this.elem, target, type, offsetX, offsetY);
    },

    show: function () {
        this.elem.style.display = '';

        // 隐藏之前的项。
        if (this.currentMenu) {
            this.currentMenu.className = '';

            // 同时隐藏子菜单。
            this.hideSubMenu();
        }

        Dom.on(document, 'click', this.hide, this);
    },

    hide: function (e) {
        if (e) {
            Dom.un(document, 'click', this.hide);
        }
        this.hideSubMenu();
        this.elem.style.display = 'none';
    },

    clickItem: function (item) {

        // 判断是否有子菜单。
        var data = this.items[item.getAttribute('data-key')];

        if (data.subMenu) {
            return false;
        }

        // 点击项。
        ide.execCommand(data.command);
    },

    showSubMenu: function (item) {

        // 判断是否有子菜单。
        var data = this.items[item.getAttribute('data-key')].subMenu;
        
        if (data) {

            // 如果之前没有显示过子菜单，则创建一个。
            if (this.subMenu) {
                this.subMenu.elem.style.display = '';
            } else {
                this.subMenu = new Menu().renderTo(this.elem.parentNode);
            }

            this.subMenu.set(data);

            Dom.pin(this.subMenu.elem, this.elem, 'r');
        }

    },

    hideSubMenu: function () {

        // 如果有子菜单，则隐藏子菜单。
        if (this.subMenu) {
            this.subMenu.hideSubMenu();
            this.subMenu.elem.style.display = 'none';
        }
    },

    set: function (items) {
        var html = [], key, data;

        this.items = items;

        for (key in items) {

            data = items[key];

            if (data === '-') {
                html.push('<li class="menu-seperator"></li>');
            } else {

                html.push('<li data-key="', key, '"', ide.queryCommandState(data.command) === false ? ' class="menu-disabled"' : '', '><span class="right icon icon-', data.subMenu ? 'right' : 'none', ' menu-submenu"></span>');

                if (data.shortcutKey) {
                    html.push('<span class="right menu-shortcut">', data.shortcutKey, '</span>');
                }

                html.push('<span class="icon icon-', ({
                    checked: 'checkbox',
                    selected: 'radio-checked',
                    unselected: 'radio-unchecked'
                })[ide.queryCommandValue(data.command)] || data.icon, ' menu-icon"></span>', data.text, '</li>');
            }
        }

        this.elem.innerHTML = html.join('');
    }

});
