var Menu = function(cm, items, callback)
{
	this.cm = cm;
	this.items = items;
	this.callback = callback;
	this.dom = null;
	this.child = null;
	this.selected = null;
};

Menu.prototype.create = function(parent, pos, is_root)
{
	var ul = $('<ul>');
	
	ul.addClass('menu-panel');
	ul.css('position', 'absolute');
	ul.css('z-index', '10000');
	
	if(!is_root)
	{
		ul.mouseleave(function(self) { return function(e)
		{
			self.destroy();
		}}(self));
	}
	
	for(var i = 0, len = this.items.length; i < len; i++)
	{
		var item = this.items[i];
		var li = make('li');
		var span = make('span');
		
		if(item.icon)
		{
			var icon = make('span');
			
			icon.addClass('menu-icon')
			li.append(icon.addClass('icon-' + item.icon));
		}
		
		span.addClass('menu-lbl');
		span.text(item.name);
		
		li.append(span);
		
		if(item.items)
		{
			var grp = make('span');
			
			li.addClass('menu-grp-item');
			li.append(grp.addClass('menu-grp-img'));
		
			li.mouseenter(function(self, grp, li, item) { return function(e)
			{
				var ofs = grp.offset();
				
				self.select(li)
				self.child = new Menu(self.cm, item.items, self.callback);
				self.child.create(self, [ofs.left + 18, ofs.top - 4], true);
			}}(this, grp, li, item));

			li.mousedown(function(e)
			{
				return false;
			});
		}
		else
		{
			li.addClass('menu-item');
			
			li.mouseenter(function(self, li) { return function(e)
			{
				self.select(li);
			}}(this, li));

			li.mousedown(function(self, item) { return function(e)
			{
				self.cm.hide();
				self.callback(item.icon, self.cm.pos);
				e.stopPropagation();
				return false;
			}}(this, item));
		}
		
		ul.append(li);
	}
	
	this.dom = ul;

	$('body').append(ul);
	
	ul.show();

	var w = ul[0].clientWidth;
	var h = ul[0].clientHeight;
	
	var win = window;
	
	// Not quite good enough, but passable for now.
	if(pos[0] + w >= win.innerWidth - 16)
	{
		var ofs = w + (parent ? parent.dom.width() : 0);
		
		pos[0] = pos[0] >= ofs ? pos[0] - ofs : 0; 
	}
		
	if(pos[1] + h >= win.innerHeight - 16)
		pos[1] = pos[1] >= h ? pos[1] - (h - 18) : 0; 
	
	ul.css({ 'left': Math.round(pos[0]), 'top': Math.round(pos[1]) });
};

Menu.prototype.select = function(elem)
{
	if(this.selected)
		this.selected.css('background-color', '#eee');
	
	if(this.child)
	{
		this.child.destroy();
		this.child = null;
	}
	
	elem.css('background-color', '#39f');
	this.selected = elem;
};

Menu.prototype.destroy = function()
{
	if(this.child)
	{
		this.child.destroy();
		this.child = null;
	}
	
	if(this.dom)
	{
		this.dom.remove();
		this.dom = null;
	}
};

var ContextMenu = function(parent, items, callback)
{
	var self = this;
	
	this.items = items;
	this.callback = callback;
	this.pos = [0, 0];
	
	$(document).bind('contextmenu', function(pid) { return function(e)
	{
		if(e.target.id !== 'canvas')
			return true;
		
		self.show([e.pageX, e.pageY]);
		return false;
	}}(parent[0].id));

	parent.mousedown(function(e)
	{
		self.hide();
		return true;
	});
};

ContextMenu.prototype.show = function(pos)
{
	this.pos = pos;
	this.hide();	
	this.menu = new Menu(this, this.items, this.callback);
	this.menu.create(null, pos, true);
};

ContextMenu.prototype.hide = function()
{
	if(this.menu)
	{
		this.menu.destroy();
		this.menu = null;
	}
};


