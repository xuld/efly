
/**
 * 表示一个工具框。
 */
var Toolbar = Control.extend({

    create: function () {
        var node = document.createElement('div');
        node.className = 'toolbar systemtext';
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
            item.className = 'toolbar-hover';

            this.showSubMenu(item);

        }, this);


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

            Dom.pin(this.subMenu.elem, this.elem, 'b');
        }

    },

    hideSubMenu: function () {

        // 如果有子菜单，则隐藏子菜单。
        if (this.subMenu) {
            this.subMenu.hideSubMenu();
            this.subMenu.elem.style.display = 'none';
        }
    },

    itemOn: function (type, fn, thisArgs) {
        Dom.on(this.elem, type, function (e) {
            var li = e.target;
            while (li && li.parentNode !== this.elem) {
                li = li.parentNode;
            }

            if (li) {
                return fn.call(this, li, e);
            }
        }, thisArgs);
    },

    // 根据 items 重新生成菜单项。 
    set: function (items) {
        var html = [], key, data;

        this.items = items;

        for (key in items) {

            data = items[key];

            if (data === '-') {
                html.push('<span class="toolbar-splitter"></span>');
            } else if (data.type === 'splitbutton') {
                html.push('<span data-key="', key, '" class="toolbar-splitbutton"><a class="toolbar-', data.type, '" href="javascript:;"', ide.queryCommandState(data.command) === false ? ' class="toolbar-disabled"' : '', '>', data.text, '</a><span class="toolbar-splitter"></span><span class="icon icon-bottom"></span></span>');
            } else {

                html.push('<a data-key="', key, '" class="toolbar-', data.type, '" href="javascript:;"', ide.queryCommandState(data.command) === false ? ' class="toolbar-disabled"' : '', '>', data.text, '</a>');

            }
        }

        this.elem.innerHTML = html.join('');

        //<a href="#" class="toolbar-menubutton">eFly</a>
        //<span class="toolbar-splitter"></span>
        //<a class="toolbar-menubutton toolbar-hover" href="#">文件(F)</a>
        //<a class="toolbar-menubutton" href="#">编辑(E)</a>
        //<a class="toolbar-menubutton" href="#">帮助(H)</a>
        //
        //<a class="toolbar-button">按钮</a>
        //<a class="toolbar-button toolbar-hover">按钮</a>
        //<span class="toolbar-splitbutton"><a>分隔按钮</a><span class="toolbar-splitter"></span><span class="icon icon-bottom"></span></span>
        //<span class="toolbar-splitbutton toolbar-hover"><a>分隔按钮</a><span class="toolbar-splitter"></span><span class="icon icon-bottom"></span></span>
    }

});
