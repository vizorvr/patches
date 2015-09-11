function Graph(core, parent_graph, uid) {
	EventEmitter.call(this)

	this.nodes = [];
	this.connections = [];
	this.core = core;
	this.variables = new E2.Variables(core);

	this.parent_graph = parent_graph;
	this.roots = [];
	this.children = [];

	this.uid = (uid !== undefined) ? uid : E2.uid();
}

Graph.prototype = Object.create(EventEmitter.prototype)

Graph.prototype.get_node_uid = function() {
	return E2.core.get_uid()
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
		if (n.plugin.play) {
			n.plugin.play();
		}
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

Graph.prototype.addNode = function(n, info) {
	this.registerNode(n, info ? info.order : null)

	this.emit('nodeAdded', n, info)

	return n
}

Graph.prototype.registerNode = function(n, order) {
	if (!order)
		this.nodes.push(n)
	else
		this.nodes.splice(order[0], 0, n)

	if (this.nuid_lut)
		this.nuid_lut[n.uid] = n
	
	if (!n.plugin.output_slots.length && !n.dyn_outputs.length)
		this.roots.push(n)
	
	if (n.plugin.isGraph) {
		if (!order)
			this.children.push(n)
		else
			this.children.splice(order[1], 0, n)

		if (E2.core.graphs.indexOf(n.plugin.graph) === -1)
			E2.core.graphs.push(n.plugin.graph)
	}

	return n
}

Graph.prototype.removeNode = function(node) {
	function nodeFilter(fnode) {
		return node !== fnode
	}

	this.nodes = this.nodes.filter(nodeFilter);
	
	if (this.nuid_lut)
		delete this.nuid_lut[node.uid];
	
	if (!node.plugin.output_slots.length && !node.dyn_outputs.length) 
		this.roots = this.roots.filter(nodeFilter);
	
	if (node.plugin.isGraph) {
		this.children = this.children.filter(nodeFilter);
		E2.core.graphs.splice(E2.core.graphs.indexOf(node.plugin.graph), 1)
	}

	if (node.plugin.stop)
		node.plugin.stop()

	this.emit('nodeRemoved', node)

	return node
}

Graph.prototype.renameNode = function(node, title) {
	node.title = title
	this.emit('nodeRenamed', node)
}

Graph.prototype.addConnection = function(connection) {
	this.connections.push(connection)

	return connection
}

Graph.prototype.connect = function(connection) {
	return this.addConnection(connection)
}

Graph.prototype.disconnect = function(c) {
	var index = this.connections.indexOf(c)

	if (index !== -1)
		this.connections.splice(index, 1)

	if (c.dst_node)
		c.dst_node.removeInput(c)

	if (c.src_node)
		c.src_node.removeOutput(c)
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

	return this.connections.filter(function(c) {
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
	
	d.uid = this.uid;
	d.parent_uid = this.parent_graph ? this.parent_graph.uid : -1;
	d.open = this.open;
	d.nodes = [];
	d.conns = [];
	
	this.enum_all(function(n) { d.nodes.push(n.serialise()); }, function(c) { d.conns.push(c.serialise()); });
	this.variables.serialise(d);
	
	return d;
}

Graph.prototype.deserialise = function(d) {
	this.uid = '' + d.uid;
	this.parent_graph = d.parent_uid;
			
	this.nodes = [];
	this.roots = [];
	this.children = [];
	this.open = d.open || false;
	
	var i, len

	for(i = 0, len = d.nodes.length; i < len; i++) {
		var n = new Node()
		
		if (n.deserialise(this.uid, d.nodes[i]))
			this.registerNode(n)
	}

	this.connections = []

	for(i = 0, len = d.conns.length; i < len; i++) {
		var c = new Connection()
		c.deserialise(d.conns[i])
		this.connections.push(c)
	}
	
	if (d.registers)
		d.variables = d.registers // backwards compat

	if (d.variables)
		this.variables.deserialise(d.variables)
}

Graph.prototype.patch_up = function(graphs) {
	if (!(this.parent_graph instanceof Graph))
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
	return this.title
}

Graph.prototype.reorder_children = function(original, sibling, insert_after) {
	function reorder(arr) {
		arr.remove(original);
		
		var i = arr.indexOf(sibling);
		
		if (insert_after)
			i++;
		
		arr.splice(i, 0, original);
	}

	reorder(this.children);
	reorder(this.nodes);
};

Graph.prototype.findConnectionByUid = function(cuid) {
	var connection
	this.connections.some(function(c) {
		if (c.uid === cuid) {
			connection = c
			return true
		}
	})

	return connection
}

Graph.prototype.findNodeByUid = function(nuid) {
	var node
	this.nodes.some(function(n) {
		if (n.uid === nuid) {
			node = n
			return true
		}
	})

	if (!node) {
		msg('ERROR: Failed to resolve node('+nuid+') in graph(' + this.uid + ')')
		console.log('Graph nodes', this.nodes)
	}

	return node
}

Graph.lookup = function(guid) {
	return Graph.resolve_graph(E2.core.graphs, guid)
}

Graph.resolve_graph = function(graphs, guid) {
	for(var i = 0, len = graphs.length; i < len; i++) {
		if (graphs[i].uid === guid)
			return graphs[i]
	}

	if (guid !== -1) {
		msg('ERROR: Failed to resolve graph(' + guid + ')')
		console.log('Graphs', graphs)
	}
	
	return null;
}

if (typeof(module) !== 'undefined') {
	module.exports = Graph
	var Connection = require('./connection').Connection
}

