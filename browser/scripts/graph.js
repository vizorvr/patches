function Graph(core, parent_graph, tree_node) 
{
	this.tree_node = tree_node;
	this.listeners = [];
	this.nodes = [];
	this.connections = [];
	this.core = core;
	this.registers = new Registers(core);

	if(tree_node !== null) // Only initialise if we're not deserialising.
	{
		this.uid = this.core.get_graph_uid();
		this.parent_graph = parent_graph;
		this.roots = [];
		this.children = [];
		this.node_uid = 0;
			
		tree_node.graph = this;
	}
}

Graph.prototype.get_node_uid = function()
{
	return this.node_uid++;
};

Graph.prototype.register_node = function(n)
{
	this.nodes.push(n);
	
	if(n.plugin.output_slots.length === 0 && !n.dyn_outputs) 
		this.roots.push(n);
	else if(n.plugin.e2_is_graph)
		this.children.push(n);
};

Graph.prototype.unregister_node = function(n)
{
	this.nodes.remove(n);
	
	if(n.plugin.output_slots.length === 0 && !n.dyn_outputs) 
		this.roots.remove(n);
	else if(n.plugin.e2_is_graph)
		this.children.remove(n);
};

Graph.prototype.create_instance = function(plugin_id, x, y)
{
	n = new Node(this, plugin_id, x, y);
	
	this.register_node(n);
	this.emit_event({ type: 'node-created', node: n });

	return n;
};

Graph.prototype.update = function(delta_t)
{
	var nodes = this.nodes;
	var roots = this.roots;
	var children = this.children;
	var dirty = false;
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].update_count = 0;
	
	for(var i = 0, len = roots.length; i < len; i++)
		dirty = roots[i].update_recursive(this.connections) || dirty;
	
	for(var i = 0, len = children.length; i < len; i++)
	{
		var c = children[i];
		
		if(!c.plugin.texture) // TODO: Huh? Comment this.
			dirty = c.update_recursive(this.connections) || dirty;
	}

	if(dirty && this === E2.app.player.core.active_graph)
		E2.app.player.core.active_graph_dirty = dirty;
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].plugin.updated = false;
	
	return dirty;
};

Graph.prototype.enum_all = function(n_delegate, c_delegate)
{
	if(n_delegate)
	{
		var nodes = this.nodes;
		    
		for(var i = 0, len = nodes.length; i < len; i++)
			n_delegate(nodes[i]);
	}

	if(c_delegate)
	{
		var conns = this.connections;
	    
		for(var i = 0, len = conns.length; i < len; i++)
			c_delegate(conns[i]);
	}
};

Graph.prototype.reset = function()
{
	this.enum_all(function(n)
	{
		n.reset();
	},
	function(c)
	{
		c.reset();
	});
};

Graph.prototype.play = function()
{
	this.enum_all(function(n)
	{
		if(n.plugin.play)
			n.plugin.play();
	}, null);
};

Graph.prototype.pause = function()
{
	this.enum_all(function(n)
	{
		if(n.plugin.pause)
			n.plugin.pause();
	}, null);
};

Graph.prototype.stop = function()
{
	this.enum_all(function(n)
	{
		if(n.plugin.stop)
			n.plugin.stop();
	}, null);
};

Graph.prototype.destroy_connection = function(c)
{
	var index = this.connections.indexOf(c);
	
	if(index !== -1)
		this.connections.splice(index, 1);
	
	c.dst_slot.is_connected = false;
	
	var slots = c.dst_node.inputs;
	
	index = slots.indexOf(c);

	if(index !== -1)
		slots.splice(index, 1);

	slots = c.src_node.outputs;
	index = slots.indexOf(c);

	if(index !== -1)
		slots.splice(index, 1);
};

Graph.prototype.create_ui = function()
{
	this.enum_all(function(n)
	{
		n.create_ui();

		if(n.ui && n.plugin.state_changed)
			n.plugin.state_changed(n.ui.plugin_ui);
	},
	function(c)
	{
		c.create_ui();
		c.ui.resolve_slot_divs();
	});
};

Graph.prototype.destroy_ui = function()
{
	this.enum_all(function(n) { n.destroy_ui(); }, function(c) { c.destroy_ui(); });
};

Graph.prototype.find_connections_from = function(node, slot)
{
	if(slot.type !== E2.slot_type.output)
		return [];
	
	var conns = this.connections;
	var uid = node.uid;
	var result = [];
	
	for(var i = 0, len = conns.length; i < len; i++)
	{
		var c = conns[i];
		
		if(c.src_node.uid === uid && c.src_slot === slot)
			result.push(c);			
	}
	
	return result;
};

Graph.prototype.serialise = function()
{
	var d = {};
	
	d.node_uid = this.node_uid;
	d.uid = this.uid;
	d.parent_uid = this.parent_graph ? this.parent_graph.uid : -1;
	d.open = !this.tree_node.closed;
	d.nodes = [];
	d.conns = [];
	
	this.enum_all(function(n) { d.nodes.push(n.serialise()); }, function(c) { d.conns.push(c.serialise()); });
	this.registers.serialise(d);
	
	return d;
};

Graph.prototype.deserialise = function(d)
{
	this.node_uid = d.node_uid;
	this.uid = d.uid;
	this.parent_graph = d.parent_uid;
			
	this.nodes = [];
	this.roots = [];
	this.children = [];
	this.open = d.open || false;
	
	for(var i = 0, len = d.nodes.length; i < len; i++)
	{
		var n = new Node(null, null, null, null);
		
		if(n.deserialise(this.uid, d.nodes[i]))
			this.register_node(n);
	}

	this.connections = [];

	for(var i = 0, len = d.conns.length; i < len; i++)
	{
		var c = new Connection(null, null, null, null);
		
		c.deserialise(d.conns[i]);
		this.connections.push(c);
	}
	
	if(d.registers)
		this.registers.deserialise(d.registers);
};

Graph.prototype.patch_up = function(graphs)
{
	this.parent_graph = Graph.resolve_graph(graphs, this.parent_graph);

	// Cannot use enum_all for this!
	var nodes = this.nodes,
	    conns = this.connections;
	    
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].patch_up(graphs);

	prune = [];
	
	for(var i = 0, len = conns.length; i < len; i++)
	{
		var c = conns[i];
		
		if(!c.patch_up(this.nodes))
			prune.push(c);
	}
	
	for(var i = 0, len = prune.length; i < len; i++)
		conns.remove(prune[i]);
};

Graph.prototype.initialise = function()
{
	var nodes = this.nodes;
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].initialise();

	this.reset();
};

Graph.prototype.reg_listener = function(delegate)
{
	if(!this.listeners.indexOf(delegate) !== -1)
		this.listeners.push(delegate);
};

Graph.prototype.emit_event = function(ev)
{
	var l = this.listeners,
	    len = l.length;
	
	if(len === 0)
		return;
	
	for(var i = 0; i < len; i++)
		l[i](ev);
};
	
Graph.prototype.build_breadcrumb = function(parent, add_handler)
{
	var sp = $('<span>' + this.tree_node.title + '</span>');
	
	sp.css('cursor', 'pointer');
	
	if(add_handler)
	{
		sp.click(function(self) { return function()
		{
			self.tree_node.activate();
		}}(this));
		
		sp.css({ 'text-decoration': 'underline' });
	}
	
	parent.prepend($('<span> / </span>'));
	parent.prepend(sp);
	
	if(this.parent_graph)
		this.parent_graph.build_breadcrumb(parent, true);
};

Graph.prototype.reorder_children = function(node, src, hit_mode)
{
	var nn = node.graph.plugin.parent_node;
	var sn = src.graph.plugin.parent_node;
	
	var reorder = function(arr)
	{
		arr.remove(sn);
		
		var i = arr.indexOf(nn);
		
		if(hit_mode === 'after')
			i++;
		
		arr.splice(i, 0, sn);
	};
	
	// We have to reorder the .nodes array too, since the .children array is not persisted and
	// is rebuilt from .nodes during deserialization.
	reorder(this.children, node, src, hit_mode);
	reorder(this.nodes, node, src, hit_mode);
};

Graph.resolve_graph = function(graphs, guid)
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

if (typeof(exports) !== 'undefined')
	exports.Graph = Graph;

