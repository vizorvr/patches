var Menu = function(cm, items, callback) {
	this.cm = cm;
	this.items = items;
	this.callback = callback;
	this.dom = null;
	this.child = null;
	this.selected = null;
};

Menu.prototype.create = function(parent, position, is_root)
{
	var ul = $('<ul>');
	
	ul.addClass('menu-panel');
	ul.css('position', 'absolute');
	ul.css('z-index', '10000');
	
	ul.bind('contextmenu', function()
	{
		return false;
	});
	
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
		
		span.text(item.name);
		
		li.append(span);
		
		if(item.items)
		{
			var $group = make('span');
			
			span.addClass('menu-lbl-grp');
			li.addClass('menu-grp-item');
			li.append($group.addClass('menu-grp-img'));
		
			li.mouseenter(function(self, $groupElement, li, item) { return function(e)
			{
				var groupOffset = $groupElement.offset();
				
				self.select(li)
				self.child = new Menu(self.cm, item.items, self.callback);
				self.child.create(self, [groupOffset.left + 18, groupOffset.top - 4], true);
			}}(this, $group, li, item));

			li.mousedown(function(e)
			{
				return false;
			});
		}
		else
		{
			span.addClass('menu-lbl');
			li.addClass('menu-item');
			
			li.mouseenter(function(self, li) { return function(e)
			{
				self.select(li);
			}}(this, li));

			li.mousedown(function(self, item) { return function(e)
			{
				self.cm.hide();
				self.callback(item.icon, self.cm.called_pos);
				e.stopPropagation();
				return false;
			}}(this, item));
		}
		
		ul.append(li);
	}
	
	this.dom = ul;

	$('body').append(ul);
	
	var w = ul[0].clientWidth;
	var h = ul[0].clientHeight;
	
	var win = window;
	
	// Not quite good enough, but passable for now.
	if(position[0] + w >= win.innerWidth - 16)
	{
		var ofs = w + (parent ? parent.dom.width() : 0);
		
		position[0] = position[0] >= ofs ? position[0] - ofs : 0;
	}
		
	if(position[1] + h >= win.innerHeight - 16)
		position[1] = position[1] >= h ? position[1] - (h - 18) : 0;
	
	var s = ul[0].style;
	
	s.left = '' + Math.round(position[0]) + 'px';
	s.top = '' + Math.round(position[1]) + 'px';
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

function ContextMenu(parent, items) {
	EventEmitter.call(this)
	var that = this;

	this.pos = [0, 0];
	this.called_pos = [0,0];

	this.items = items;
	this.callback = function(icon, pos) {
		that.emit('created', icon, that.called_pos)
	};

	
	$(document).bind('contextmenu', function(e) {
		if(e.target.id !== 'canvas')
			return true;

		that.pos = [e.pageX, e.pageY];
		that.called_pos = [e.offsetX, e.offsetY];	// remembers the offset in the canvas for creating the plugin later
		that.show(that.pos);						// shows the menu as before
		return false;
	})

	parent.mousedown(function() {
		that.hide();
		return true;
	});
}

ContextMenu.prototype = Object.create(EventEmitter.prototype)

ContextMenu.prototype.show = function(pos) {
	this.pos = pos;
	this.hide();
	this.menu = new Menu(this, this.items, this.callback);
	this.menu.create(null, pos, true);
}

ContextMenu.prototype.hide = function() {
	if(this.menu) {
		this.menu.destroy();
		this.menu = null;
	}
}