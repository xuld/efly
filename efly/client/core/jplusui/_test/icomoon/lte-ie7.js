/* Use this script if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icomoon\'">' + entity + '</span>' + html;
	}
	var icons = {
			'icon-search' : '&#xe1000;',
			'icon-play' : '&#xe00b;',
			'icon-floppy' : '&#xe195;',
			'icon-copy' : '&#xe017;',
			'icon-arrow-left' : '&#xe0bf;',
			'icon-home' : '&#xe000;',
			'icon-file' : '&#xe014;',
			'icon-folder' : '&#xe018;',
			'icon-folder-2' : '&#xe019;',
			'icon-user' : '&#xe042;',
			'icon-zoom-in' : '&#xe048;',
			'icon-zoom-out' : '&#xe049;',
			'icon-help' : '&#xe091;',
			'icon-cancel' : '&#xe095;',
			'icon-checkmark' : '&#xe096;',
			'icon-minus' : '&#xe097;',
			'icon-plus' : '&#xe098;',
			'icon-cancel-2' : '&#xe094;',
			'icon-checkbox' : '&#xe0c6;',
			'icon-checkbox-unchecked' : '&#xe0c7;',
			'icon-checkbox-partial' : '&#xe0c8;',
			'icon-radio-checked' : '&#xe0c9;',
			'icon-radio-unchecked' : '&#xe0ca;',
			'icon-new-tab' : '&#xe0d3;',
			'icon-new-tab-2' : '&#xe0d4;',
			'icon-code' : '&#xe0d6;',
			'icon-chrome' : '&#xe137;',
			'icon-firefox' : '&#xe138;',
			'icon-IE' : '&#xe139;',
			'icon-opera' : '&#xe13a;',
			'icon-safari' : '&#xe13b;',
			'icon-html5' : '&#xe134;',
			'icon-file-css' : '&#xe133;',
			'icon-libreoffice' : '&#xe12b;',
			'icon-file-xml' : '&#xe132;',
			'icon-warning' : '&#xe13d;',
			'icon-spin' : '&#xe1e0;',
			'icon-plus-2' : '&#xe1c9;',
			'icon-minus-2' : '&#xe1cb;',
			'icon-checkmark-2' : '&#xe1b2;',
			'icon-x' : '&#xe1b4;',
			'icon-arrow-right' : '&#xe09f;',
			'icon-untitled' : '&#xf0d7;',
			'icon-untitled-2' : '&#xf0d8;',
			'icon-untitled-3' : '&#xf0d9;',
			'icon-untitled-4' : '&#xf0da;',
			'icon-untitled-5' : '&#xf0dd;',
			'icon-untitled-6' : '&#xf0de;',
			'icon-untitled-7' : '&#xf0dc;',
			'icon-untitled-8' : '&#xf0db;',
			'icon-untitled-9' : '&#xf0e2;',
			'icon-untitled-10' : '&#xf054;',
			'icon-untitled-11' : '&#xf053;',
			'icon-untitled-12' : '&#xf077;',
			'icon-untitled-13' : '&#xf078;',
			'icon-untitled-14' : '&#xf060;',
			'icon-untitled-15' : '&#xf061;',
			'icon-untitled-16' : '&#xf062;',
			'icon-untitled-17' : '&#xf063;',
			'icon-untitled-18' : '&#xf021;',
			'icon-untitled-19' : '&#xf067;',
			'icon-untitled-20' : '&#xf068;',
			'icon-untitled-21' : '&#xf0e8;',
			'icon-untitled-22' : '&#xf0c4;',
			'icon-untitled-23' : '&#xf0c5;',
			'icon-untitled-24' : '&#xf0c7;'
		},
		els = document.getElementsByTagName('*'),
		i, attr, html, c, el;
	for (i = 0; i < els.length; i += 1) {
		el = els[i];
		attr = el.getAttribute('data-icon');
		if (attr) {
			addIcon(el, attr);
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
};