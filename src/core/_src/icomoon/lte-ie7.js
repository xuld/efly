/* Use this script if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icomoon\'">' + entity + '</span>' + html;
	}
	var icons = {
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
			'icon-arrow-right' : '&#xe09f;',
			'icon-bottom' : '&#xf0d7;',
			'icon-left' : '&#xf0d9;',
			'icon-right' : '&#xf0da;',
			'icon-updown-down' : '&#xf0dd;',
			'icon-updown-up' : '&#xf0de;',
			'icon-updown' : '&#xf0dc;',
			'icon-split' : '&#xf0db;',
			'icon-untitled' : '&#xf0e2;',
			'icon-next' : '&#xf054;',
			'icon-prev' : '&#xf053;',
			'icon-untitled-2' : '&#xf077;',
			'icon-untitled-3' : '&#xf078;',
			'icon-untitled-4' : '&#xf060;',
			'icon-untitled-5' : '&#xf061;',
			'icon-untitled-6' : '&#xf062;',
			'icon-untitled-7' : '&#xf063;',
			'icon-plus-2' : '&#xf067;',
			'icon-minus-2' : '&#xf068;',
			'icon-untitled-8' : '&#xf0e8;',
			'icon-cut' : '&#xf0c4;',
			'icon-copy-2' : '&#xf0c5;',
			'icon-save' : '&#xf0c7;',
			'icon-search' : '&#xe1000;',
			'icon-wrench' : '&#xe001;',
			'icon-top' : '&#xf0d8;',
			'icon-untitled-9' : '&#xf002;',
			'icon-untitled-10' : '&#xf040;',
			'icon-untitled-11' : '&#xf044;',
			'icon-untitled-12' : '&#xf05a;',
			'icon-untitled-13' : '&#xf059;',
			'icon-untitled-14' : '&#xf058;',
			'icon-untitled-15' : '&#xf057;',
			'icon-untitled-16' : '&#xf05e;',
			'icon-checkbox-unchecked' : '&#xe0c7;',
			'icon-checkmark-2' : '&#xe002;',
			'icon-cancel-3' : '&#xe003;',
			'icon-cog' : '&#xe004;',
			'icon-left-to-right' : '&#xe005;',
			'icon-expand' : '&#xe006;',
			'icon-contract' : '&#xe007;',
			'icon-spin' : '&#xe1e0;',
			'icon-new-window' : '&#xe008;',
			'icon-pin' : '&#xe009;',
			'icon-lock-fill' : '&#xe00c;',
			'icon-unlock-stroke' : '&#xe00d;',
			'icon-pilcrow' : '&#xe00e;',
			'icon-at' : '&#xe00f;',
			'icon-pin2' : '&#xe00a;',
			'icon-none' : '&#xf000;'
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