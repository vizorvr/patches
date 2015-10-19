
// Monkey-patch the window object with a request/cancelAnimationFrame shims.
window.requestAnimFrame = (function()
{
	return window.requestAnimationFrame       || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame
})();

window.cancelAnimFrame = (function()
{
	return window.cancelAnimationFrame       || 
		window.webkitCancelAnimationFrame || 
		window.mozCancelAnimationFrame
})();

Array.prototype.remove = function(obj)
{
	var i = this.indexOf(obj);
	
	if(i !== -1)
		this.splice(i, 1);
};

function clone_recursive(from, to)
{
    if (from == null || typeof from != "object") return from;
    if (from.constructor != Object && from.constructor != Array) return from;
    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
        return new from.constructor(from);

    to = to || new from.constructor();

    for (var name in from)
    {
        to[name] = typeof to[name] == "undefined" ? clone_recursive(from[name], null) : to[name];
    }

    return to;
}

function clone(o) {
	return clone_recursive(o, null);
};

function make(tag)
{
	return $(document.createElement(tag));
}

function makeButton(text, alt, className)
{
	text = text || '';
	alt = alt ? ' title="' + alt + '"' : '';
	className = className ? ' ' + className : '';
	
	return $('<button class="btn btn-xs' + className + '"' + alt + '>' + text + '</button>');
}

function resolve_graph(graphs, guid)
{
	for(var i = 0, len = graphs.length; i < len; i++)
	{
		if(graphs[i].uid === guid)
			return graphs[i]; 
	}

	if(guid !== -1)
		msg('ERROR: Failed to resolve graph(' + guid + ')');
	
	return null;
};

function load_style(url)
{
	var link = document.createElement('link');
	
	link.rel = 'stylesheet';
	link.href = url;
	
	document.getElementById('head').appendChild(link);
}

function sort_dict(dict)
{
	var s = [], key;
	
	for(key in dict)
		s.push(key);
		
	// JS has a quaint notion of what "alphabetically" means. Apparently all 
	// upper caps letters preceeds lower case ones. Let's fix that.
	s.sort(function(a, b)
	{
		var _a = a.toLowerCase();
		var _b = b.toLowerCase();
		
		return _a < _b ? -1 : _a > _b ? 1 : 0;
	});

	return s;
}

function msg(txt) {
	var d = E2.dom.dbg;

	if (d === undefined) {
		console.log(txt);
		return;
	}
	
	if(txt) {
		if(txt.substring(0,  7) === 'ERROR: ') {
			console.error(txt)
			d.append('<span style="color:#f20">' + txt + '</span>\n');
		}
		else if(txt.substring(0,  9) === 'WARNING: ') {
			console.warn(txt)
			d.append('<span style="color:#fa0">' + txt + '</span>\n');
		}
		else if(txt.substring(0,  6) === 'INFO: ') {
			console.log(txt)
			d.append('<span style="color:#04f">' + txt + '</span>\n');
		}
		else {
			console.log(txt)
			d.append(txt + '\n');
		}
	}
	
	d.scrollTop(d[0].scrollHeight);
}

function ExpandableTextfield(node, tf, def_width)
{
	var self = this;
	
	this.node = node;
	this.tf = tf;
	this.def_width = def_width;
	
	this.update = function()
	{
		var s = '' + self.tf.val();
		
		// self.tf[0].style.width = ((Math.max(self.def_width, s.length) * 7) + 2) + 'px';
		self.node.geometry_updated();
	};
	
	var handler = function(self) { return function()
	{
		self.update();
	}}(this);
	
	tf.change(handler);
	tf.keyup(handler);
}

function load_script(url, onload, onerror) {
	var script = document.createElement('script');

	script.src = url;
	
	if (!onload)
		throw new Error('load_script without listener')

	script.onload = onload;
	script.onerror = onerror;
	
	document.getElementsByTagName('head')[0].appendChild(script);	
}

E2.util = {
	isFirstTime: function() {
		return Cookies.get('vizor100') === undefined
	},
	isMobile: function() {
		var check = false;
		
		(function(a){
			if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))
				check = true
		})(navigator.userAgent||navigator.vendor||window.opera)

		return check
	},
	
	isScrolledIntoView: function isScrolledIntoView(elem) {
		var docViewTop = $(window).scrollTop();
		var docViewBottom = docViewTop + $(window).height();
		var elemTop = $(elem).offset().top;
		return ((elemTop <= docViewBottom) && 
			(elemTop >= docViewTop));
	},

	isTextInputInFocus: function isTextInputInFocus(e) {
		var rx = /INPUT|SELECT|TEXTAREA/i;
		var is= (rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly);
		return is
	},
	checkBrowser: function() {
		var agent = navigator.userAgent;
		var $dialog;
		if ((/Chrome/i.test(agent)) || (/Firefox/i.test(agent))) {
			
		}
		else if (E2.util.isMobile()) {
			$dialog = bootbox.dialog({
				title: 'Mobile support',
				message: '<h4>Please view this page on your desktop/laptop. '+
						 'The editor is not ready for mobile just yet.</h4>',
				onEscape: true,
				html: true,
				buttons: { Ok: function() {}}
			})

			$dialog.find('.modal-dialog').addClass('modal-sm')
			$dialog.css({
				top: '50%',
				'margin-top': function () {
					return -($dialog.height() / 2);
				}
			});
		}
		else {
		   $dialog = bootbox.dialog({
				title: 'Browser support',
				message: '<h4>We want you to fully enjoy Vizor. Please use '+
						 '<a href="http://www.google.com/chrome/" target="_'+
						 'blank" alt="Get Chrome">Chrome</a> or <a href="ht'+
						 'tp://www.mozilla.org/firefox/new/" target="_blank"'+
						 ' alt="Get Firefox">Firefox</a> to launch Vizor.</h4>',
				onEscape: true,
				html: true,
				buttons: { Ok: function() {}}
			}).init(function(){
				$dialog.find('.modal-dialog').addClass('modal-sm')
				$dialog.css({
					top: '50%',
					'margin-top': function () {
						return -(this.height() / 2);
					}
				});
			});
		}
	}
}
