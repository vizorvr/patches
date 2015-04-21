function Graph(core, parent_graph, tree_node) {
	EventEmitter.call(this)

	this.tree_node = tree_node;
	this.nodes = [];
	this.connections = [];
	this.core = core;
	this.registers = new Registers(core);

	if (tree_node) { // Only initialise if we're not deserialising.
		this.uid = this.core.get_graph_uid();
		this.parent_graph = parent_graph;
		this.roots = [];
		this.children = [];
			
		tree_node.graph = this;
	}
}

Graph.prototype = Object.create(EventEmitter.prototype)

Graph.prototype.get_node_uid = function() {
	return Date.now() //this.node_uid++;
}

Graph.prototype.update = function() {
	var nodes = this.nodes
	var roots = this.roots
	var children = this.children
	var dirty = false
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].update_count = 0
	
	for(var i = 0, len = roots.length; i < len; i++)
		dirty = roots[i].update_recursive(this.connections) || dirty
	
	for(var i = 0, len = children.length; i < len; i++) {
		var c = children[i]
		
		if (!c.plugin.texture) // TODO: Huh? Comment this.
			dirty = c.update_recursive(this.connections) || dirty
	}

	if(dirty && this === E2.app.player.core.active_graph)
		E2.app.player.core.active_graph_dirty = dirty
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].plugin.updated = false

	return dirty;
}

Graph.prototype.enum_all = function(nodeCb, connCb) {
	if (nodeCb) {
		var nodes = this.nodes;
		    
		for(var i = 0, len = nodes.length; i < len; i++)
			nodeCb(nodes[i]);
	}

	if (connCb) {
		var conns = this.connections;
	    
		for(var i = 0, len = conns.length; i < len; i++)
			connCb(conns[i]);
	}
}

Graph.prototype.reset = function() {
	var nodes = this.nodes, conns = this.connections;
	var i, len

	for(i = 0, len = nodes.length; i < len; i++)
		nodes[i].reset();
    
	for(i = 0, len = conns.length; i < len; i++)
		conns[i].reset();
}

Graph.prototype.play = function() {
	this.enum_all(function(n) {
		if(n.plugin.play)
			n.plugin.play();
	}, null);
}

Graph.prototype.pause = function() {
	this.enum_all(function(n) {
		if(n.plugin.pause)
			n.plugin.pause();
	}, null);
}

Graph.prototype.stop = function() {
	this.enum_all(function(n) {
		if(n.plugin.stop)
			n.plugin.stop();
	}, null);
}

Graph.prototype.addNode = function(n) {
	this.registerNode(n)

	this.emit('changed')
	this.emit('nodeAdded', n)

	return n
}

Graph.prototype.registerNode = function(n) {
	this.nodes.push(n)
	
	if(this.nuid_lut)
		this.nuid_lut[n.uid] = n
	
	if(n.plugin.output_slots.length === 0 && !n.dyn_outputs) 
		this.roots.push(n)
	else if(n.plugin.isGraph)
		this.children.push(n)

	return n
}

Graph.prototype.removeNode = function(node) {
	function nodeFilter(fnode) {
		return node !== fnode
	}

	this.nodes = this.nodes.filter(nodeFilter);
	
	if (this.nuid_lut)
		delete this.nuid_lut[node.uid];
	
	if (node.plugin.output_slots.length === 0 && !node.dyn_outputs) 
		this.roots = this.roots.filter(nodeFilter);
	else if(node.plugin.isGraph)
		this.children = this.children.filter(nodeFilter);

	this.emit('changed')
	this.emit('nodeRemoved', node)

	return node
}

Graph.prototype.renameNode = function(node, title) {
	node.title = title
	this.emit('nodeRenamed', node)
}

Graph.prototype.addConnection = function(connection) {
	if (!connection.patch_up(this.nodes)) {
		console.warn('Failed to connect', connection)
		return false
	}

	this.connections.push(connection)

	connection.src_slot.is_connected = true
	connection.dst_slot.is_connected = true

	this.emit('connected', connection)
	this.emit('changed')

	return connection
}

Graph.prototype.connect = function(offset, srcNode, destNode, ss, ds) {
	var c = new Connection(srcNode, destNode, ss, ds)
	c.offset = offset
	return this.addConnection(c)
}

Graph.prototype.disconnect = function(c) {
	var index = this.connections.indexOf(c)
	var slots

	if (index !== -1)
		this.connections.splice(index, 1)

	if (c.dst_node) {
		c.dst_slot.is_connected = false
		slots = c.dst_node.inputs
		index = slots.indexOf(c)
		if (index !== -1)
			slots.splice(index, 1)
	}

	if (c.src_node) {
		slots = c.src_node.outputs
		index = slots.indexOf(c)

		if (index !== -1)
			slots.splice(index, 1)
	}

	this.emit('disconnected', c)
	this.emit('changed')
}

Graph.prototype.create_ui = function() {
	this.nuid_lut = [];

	for(var i = 0, len = this.nodes.length; i < len; i++) {
		var n = this.nodes[i];
		this.nuid_lut[n.uid] = n;
	}

	this.enum_all(function(n) {
		n.create_ui()

		if (n.plugin.state_changed)
			n.plugin.state_changed(n.ui.plugin_ui)
	},
	function(c) {
		c.create_ui()
		c.ui.resolve_slot_divs()
	})
}

Graph.prototype.destroy_ui = function() {
	this.enum_all(function(n) {
		n.destroy_ui();
	}, function(c) {
		c.destroy_ui();
	});

	delete this.nuid_lut;
}

Graph.prototype.find_connection_to = function(node, slot) {
	if (slot.type !== E2.slot_type.input)
		return;
	
	var uid = node.uid;

	return this.connections.filter(function(c)
	{
		return (c.dst_node.uid === uid && c.dst_slot === slot);
	})[0];
}

Graph.prototype.find_connections_from = function(node, slot) {
	if(slot.type !== E2.slot_type.output)
		return [];
	
	var uid = node.uid;
	
	return this.connections.filter(function(c)
	{
		return(c.src_node.uid === uid && c.src_slot === slot);
	});
}

Graph.prototype.serialise = function() {
	var d = {};
	
	d.node_uid = this.node_uid;
	d.uid = this.uid;
	d.parent_uid = this.parent_graph ? this.parent_graph.uid : -1;
	d.open = this.open;
	d.nodes = [];
	d.conns = [];
	
	this.enum_all(function(n) { d.nodes.push(n.serialise()); }, function(c) { d.conns.push(c.serialise()); });
	this.registers.serialise(d);
	
	return d;
}

Graph.prototype.deserialise = function(d) {
	this.node_uid = d.node_uid;
	this.uid = d.uid;
	this.parent_graph = d.parent_uid;
			
	this.nodes = [];
	this.roots = [];
	this.children = [];
	this.open = d.open || false;
	
	var i, len

	for(i = 0, len = d.nodes.length; i < len; i++) {
		var n = new Node(null, null, null, null);
		
		if (n.deserialise(this.uid, d.nodes[i]))
			this.registerNode(n)
	}

	this.connections = [];

	for(i = 0, len = d.conns.length; i < len; i++) {
		var c = new Connection(null, null, null, null);
		
		c.deserialise(d.conns[i]);
		this.connections.push(c);
	}
	
	if (d.registers)
		this.registers.deserialise(d.registers)
}

Graph.prototype.patch_up = function(graphs) {
	this.parent_graph = Graph.resolve_graph(graphs, this.parent_graph);

	var nodes = this.nodes,
	    conns = this.connections;
	
	var i, len

	for(i = 0, len = nodes.length; i < len; i++)
		nodes[i].patch_up(graphs);

	prune = [];
	
	for(i = 0, len = conns.length; i < len; i++) {
		var c = conns[i];
		
		if(!c.patch_up(this.nodes))
			prune.push(c);
	}
	
	for(i = 0, len = prune.length; i < len; i++)
		conns.remove(prune[i]);
}

Graph.prototype.initialise = function() {
	var nodes = this.nodes;
	
	for(var i = 0, len = nodes.length; i < len; i++)
		nodes[i].initialise();

	this.reset();
}

Graph.prototype.getTitle = function() {
	return this.tree_node.title
}

Graph.prototype.build_breadcrumb = function(parent, add_handler) {
	var that = this
	var sp = $('<span>' + this.tree_node.title + '</span>')
	sp.css('cursor', 'pointer')
	
	if (add_handler) {
		sp.click(function() {
			that.tree_node.activate()
		})
		
		sp.css({ 'text-decoration': 'underline' })
	}
	
	parent.prepend($('<span> / </span>'))
	parent.prepend(sp)
	
	if (this.parent_graph)
		this.parent_graph.build_breadcrumb(parent, true)
}

Graph.prototype.reorder_children = function(original, sibling, insert_after) {
	function reorder(arr) {
		arr.remove(original);
		
		var i = arr.indexOf(sibling);
		
		if(insert_after)
			i++;
		
		arr.splice(i, 0, original);
	}

	reorder(this.children);
	reorder(this.nodes);
};

Graph.resolve_graph = function(graphs, guid) {
	for(var i = 0, len = graphs.length; i < len; i++) {
		if (graphs[i].uid === guid)
			return graphs[i]
	}

	if (guid !== -1)
		msg('ERROR: Failed to resolve graph(' + guid + ')')
	
	return null;
}

if (typeof(module) !== 'undefined') {
	module.exports = Graph
	var Connection = require('./connection').Connection
}

