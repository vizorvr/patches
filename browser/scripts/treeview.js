function TreeNode(tree, parent_node, title, graph_node)
{
	this.tree = tree;
	this.parent_node = parent_node;
	this.title = title;
	this.graph_node = graph_node;
	this.children = [];
	this.dom = this.label = null;
	this.closed = false;
	this.selected = false;
}

TreeNode.prototype.add_child = function(title)
{
	var tn = new TreeNode(this.tree, this, title, null);
	
	this.children.push(tn);
	this.rebuild_dom();
	return tn;
};

TreeNode.prototype.remove = function()
{
	if(!this.parent_node)
		return;
	
	var pc = this.parent_node.children;
	
	this.dom.remove();
	pc.splice(pc.indexOf(this), 1);
};

TreeNode.prototype.remove_children = function(title)
{
	this.children = [];
};

TreeNode.prototype.activate = function()
{
	this.tree.select(this);
};

TreeNode.prototype.set_title = function(title)
{
	this.title = title;
	this.rebuild_dom();
};

TreeNode.prototype.rebuild_dom = function()
{
	var dom = null;
	var lbl = null;
		
	if(this.children.length > 0 || this.parent_node === null)
	{
		dom = make('ul');
		dom.addClass('tree-sub');
		
		var handle = $('<div class="tree-handle glyphicon glyphicon-chevron-' + (this.closed ? 'right' : 'down') + '"></div>');
		
		handle[0].addEventListener('mousedown', function(t_node) { return function()
		{
			t_node.closed = !t_node.closed;
			t_node.rebuild_dom();
		}}(this));
		
		dom.append(handle);
		
		lbl = $('<span class="tree-name">' + this.title + '</span>');
		
		dom.append(lbl);
		
		if(!this.closed)
		{
			var children = this.children;
			
			for(var i = 0, len = children.length; i < len; i++)
			{
				var child = children[i];
				
				child.rebuild_dom();
				dom.append(child.dom);
			}
		}
	}
	else
	{
		dom = make('span');
		dom.addClass('tree-item');
		dom.text(this.title);
		lbl = dom;
	}
	
	lbl[0].addEventListener('mouseover', function(t_node) { return function()
	{
		t_node.tree.on_mouse_over(t_node);
	}}(this));

	lbl[0].addEventListener('mousedown', function(t_node) { return function()
	{
		t_node.tree.select(t_node);
		
		if(t_node !== t_node.tree.root && t_node.parent_node.children.length > 1)
			t_node.tree.drag_node = t_node;
	}}(this));
	
	if(this.selected)
		lbl.addClass('tree-selected');
	
	if(this.dom)
		this.dom.replaceWith(dom);
	
	this.dom = dom;
	this.label = lbl;
};

function TreeView(parent, on_activate, on_rearrange)
{
	this.parent = parent;
	this.on_activate = on_activate;
	this.on_rearrange = on_rearrange;
	this.root = new TreeNode(this, null, 'Root', null);

	this.reset();
	this.parent.append(this.root.dom);
}

TreeView.prototype.reset = function()
{
	this.root.remove_children();
	this.drag_node = null;
	this.drag_dom = null;
	this.drag_tgt = null;
	this.selected_node = null;
	this.root.closed = false;
	this.root.selected = false;
	this.root.rebuild_dom();
};

TreeView.prototype.select = function(t_node)
{
	if(this.selected_node)
	{
		this.selected_node.label.removeClass('tree-active');
		this.selected_node.selected = false;
	}
		
	this.on_activate(t_node.parent_node ? t_node.graph : this.root.graph);

	this.selected_node = t_node;
	t_node.selected = true;
	t_node.label.addClass('tree-active');
};

TreeView.prototype.on_mouse_up = function()
{
	if(this.drag_dom)
	{
		this.drag_dom.remove();
		this.drag_dom = null;
	}
	
	if(this.drag_tgt)
	{
		this.drag_tgt.removeClass('tree-drag-tgt-top tree-drag-tgt-bot');
		this.drag_tgt = null;
	}

	this.drag_node = null;
};

TreeView.prototype.on_mouse_move = function(e)
{
	if(!this.drag_node)
		return;
	
	if(!this.drag_dom)
	{
		var t_offs = this.drag_node.dom.offset();
		var x_dist = e.pageX - t_offs.left;
		var y_dist = e.pageY - t_offs.top;
		var d = Math.sqrt(Math.pow(x_dist, 2) + Math.pow(y_dist, 2));
		
		this.drag_dom = this.drag_node.dom.clone(false, false);
		var is_item = this.drag_dom.hasClass('tree-item');
		
		if(is_item)
		{
			var ul = make('ul');
			
			ul.addClass('tree-sub tree-drag tree-drag-item');
			ul.append(this.drag_dom);
			
			this.drag_dom = ul;
			this.drag_tgt = this.drag_node.dom;
		}
		else
		{
			this.drag_dom.addClass('tree-drag tree-drag-sub');
			this.drag_tgt = this.drag_dom;
		}
		
		this.drag_dom.fadeTo('fast', 0.75);
		$('body').append(this.drag_dom);
	}
	
	this.drag_dom.css({
		'left': e.pageX + 'px',
		'top': e.pageY + 'px'
	});
	
	var tgt = this.drag_tgt;
	
	if(tgt)
	{
		var mid_y = tgt.offset().top + 16;
		
		tgt.removeClass('tree-drag-tgt-top tree-drag-tgt-bot');
		tgt.addClass(e.pageY < mid_y ? 'tree-drag-tgt-top' : 'tree-drag-tgt-bot');
	}
};

TreeView.prototype.on_mouse_over = function(t_node)
{
	if(!this.drag_node)
		return;
		
	if(this.drag_tgt)
		this.drag_tgt.removeClass('tree-drag-tgt-top tree-drag-tgt-bot');
	
	if(this.drag_node.parent_node.children.indexOf(t_node) < 0)
		return;
	
	this.drag_tgt = t_node.dom;
};
