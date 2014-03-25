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

function clone(o)
{
	var no = (o instanceof Array) ? [] : {};

	for(var i in o) 
	{
		if(o[i] && typeof(o[i]) === 'object') 
			no[i] = clone(o[i]);
		else
			no[i] = o[i];
	} 
	
	return no;
};

function make(tag)
{
	return $(document.createElement(tag));
}

function makeButton(text, alt, className)
{
	text = text || '';
	alt = alt || '';
	className = className || '';
	return $('<button class="btn btn-xs ' + className + '" title="' + alt + '">' + text + '</button>');
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
	var rel = document.createAttribute('rel');
	
	link.rel = 'stylesheet';
	link.href = url;
	
	document.getElementById('head').appendChild(link);
}

function sort_dict(dict)
{
	var s = [], key;
	
	for(key in dict)
		s.push(key);
		
	s.sort();

	return s;
}

function msg(txt)
{
	var d = E2.dom.dbg;

	if(d === undefined)
		return;
	
	if(txt)
	{
		if(txt.substring(0,  7) !== 'ERROR: ')
			d.append(txt + '\n');
		else
			d.append('<span style="color:#f00">' + txt + '</span>\n');
	}
	
	d.scrollTop(d[0].scrollHeight);
}

function load_script(url)
{
	var xhrObj = new XMLHttpRequest();

	xhrObj.open('GET', url, false);
	xhrObj.send('');

	var se = document.createElement('script');
	
	se.type = "text/javascript";
	se.text = xhrObj.responseText;
	
	document.getElementsByTagName('head')[0].appendChild(se);
}

function add_script(url)
{
	var script = document.createElement('script');
	var async = document.createAttribute('async');
	
	async.nodeValue = 'false';

	script.src = url;
	script.attributes.setNamedItem(async);
	
	document.getElementById('head').appendChild(script);
}
