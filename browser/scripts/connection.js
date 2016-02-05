function ConnectionUI(parent_conn) {
	this.src_pos = [0, 0]
	this.dst_pos = [0, 0]
	this.src_slot_div = null
	this.dst_slot_div = null
	this.flow = false
	this.selected = false
	this.deleting = false
	this.parent_conn = parent_conn
	this.color = '#000'
}

ConnectionUI.prototype.resolve_slot_divs = function(and_redraw) {
	var pc = this.parent_conn;
	and_redraw = (typeof and_redraw === 'undefined' ) ? true : !!and_redraw;	// force to bool, default true

	this.src_slot_div = pc.src_node.ui.dom.find('#n' + pc.src_node.uid + (pc.src_slot.uid !== undefined ? 'do' + pc.src_slot.uid : 'so' + pc.src_slot.index));
	this.dst_slot_div = pc.dst_node.ui.dom.find('#n' + pc.dst_node.uid + (pc.dst_slot.uid !== undefined ? 'di' + pc.dst_slot.uid : 'si' + pc.dst_slot.index));

	if (and_redraw)
		E2.app.redrawConnection(pc)
}

function Connection(src_node, dst_node, src_slot, dst_slot, offset) {
	this.src_node = src_node
	this.dst_node = dst_node
	this.src_slot = src_slot
	this.dst_slot = dst_slot
	this.ui = null
	this.uid = E2.uid()
	this.offset = offset || 0
}

Connection.prototype.create_ui = function() {
	this.ui = new ConnectionUI(this)
	return this.ui
}

Connection.prototype.destroy_ui = function() {
	this.ui = null
}

Connection.prototype.reset = function() {
	if (this.ui && this.ui.flow) {
		this.ui.flow = false;
		this.ui.color = '#000'
	}
}

Connection.prototype.updateInboundNodes = function(node) {
	node.queued_update = 1;
	
	if (node.plugin.id !== 'input_proxy') {
		if (E2.GRAPH_NODES.indexOf(node.plugin.id) > -1) {
			node.plugin.graph.roots.map(this.updateInboundNodes.bind(this))
		}

		for(var i = 0, len = node.inputs.length; i < len; i++)
			this.updateInboundNodes(node.inputs[i].src_node)
	} else {
		var rp = node.parent_graph.plugin
		
		if (rp && rp.parent_node.queued_update < 0)
			this.updateInboundNodes(rp.parent_node)
	}
}

Connection.prototype.updateOutboundNodes = function(node) {
	node.queued_update = 1
	
	if (node.plugin.id !== 'output_proxy') {
		if (E2.GRAPH_NODES.indexOf(node.plugin.id) > -1) {
			node.plugin.graph.roots.map(this.updateOutboundNodes.bind(this))
		}

		for(var i = 0, len = node.outputs.length; i < len; i++)
			this.updateOutboundNodes(node.outputs[i].dst_node)
	} else {
		var rp = node.parent_graph.plugin

		if (rp && rp.parent_node.queued_update < 0)
			this.updateOutboundNodes(rp.parent_node)
	}
}

Connection.prototype.signal_change = function(on) {
	var srcNode = this.src_node
	
	if (srcNode.plugin.connection_changed) {
		srcNode.plugin.connection_changed(on, this, this.src_slot)
	}
	
	var dstNode = this.dst_node
	dstNode.inputs_changed = true

	if (!on && dstNode.plugin.update_input) {
		if (this.dst_slot.def !== undefined) {
			dstNode.plugin.update_input(this.dst_slot, clone(this.dst_slot.def))
			dstNode.plugin.updated = true
		} else {
			dstNode.plugin.update_input(this.dst_slot, E2.app.player.core.get_default_value(this.dst_slot.dt))
			dstNode.plugin.updated = true
		}
	}
	
	if (dstNode.plugin.connection_changed) {
		dstNode.plugin.connection_changed(on, this, this.dst_slot)
		dstNode.plugin.updated = true
	}
	
	if (on) {
		this.updateInboundNodes(dstNode)
		this.updateOutboundNodes(dstNode)
	}
};

Connection.prototype.serialise = function()
{
	var d = {};

	d.src_nuid = this.src_node.uid
	d.dst_nuid = this.dst_node.uid
	d.src_slot = this.src_slot.index
	d.dst_slot = this.dst_slot.index
	d.uid = this.uid
	
	d.src_connected = this.src_slot.is_connected;
	d.dst_connected = this.dst_slot.is_connected;
	
	if(this.src_slot.uid !== undefined)
		d.src_dyn = true;
	
	if(this.dst_slot.uid !== undefined)
		d.dst_dyn = true;

	if(this.offset !== 0)
		d.offset = this.offset;
	
	return d;
};

Connection.prototype.deserialise = function(d) {
	this.src_node = '' + d.src_nuid
	this.dst_node = '' + d.dst_nuid

	if (this.src_node === this.dst_node)
		debugger;

	this.uid = d.uid || E2.uid()

	this.src_slot = {
		index: d.src_slot,
		dynamic: d.src_dyn ? true : false,
		is_connected: d.src_connected
	};
	this.dst_slot = {
		index: d.dst_slot,
		dynamic: d.dst_dyn ? true : false,
		is_connected: d.dst_connected
	};
	this.offset = d.offset ? d.offset : 0;
}

Connection.prototype.patch_up = function(nodes) {
	if (this.src_node instanceof Node &&
		this.dst_slot.is_connected &&
		this.src_slot.is_connected) {
		return // already patched up (this may happen eg. on Disconnect undo)
	}

	function resolve_node(nuid) {
		if (nuid instanceof Node)
			return nuid

		for(var i = 0, len = nodes.length; i < len; i++) {
			if(nodes[i].uid === nuid)
				return nodes[i]
		}
		
		msg('ERROR: Failed to resolve node with uid = ' + nuid)
		return null
	}
	
	this.src_node = resolve_node(this.src_node)
	this.dst_node = resolve_node(this.dst_node)
	
	if (!this.src_node || !this.dst_node) {
		msg('ERROR: Source or destination node invalid - dropping connection.')
		console.log('Connection that failed', this)
		return false
	}

	var ss = (this.src_slot.dynamic ? 
		this.src_node.dyn_outputs :
		this.src_node.plugin.output_slots)[this.src_slot.index]

	var ds = (this.dst_slot.dynamic ? 
		this.dst_node.dyn_inputs :
		this.dst_node.plugin.input_slots)[this.dst_slot.index]
	
	if (!ss || !ds) {
		msg('ERROR: Source or destination slot invalid - dropping connection.')
		console.log('Connection that failed', this)
		return false
	}

	this.src_slot = ss
	this.dst_slot = ds

	var any_dt = E2.dt.ANY
	
	if (this.src_slot.dt.id !== this.dst_slot.dt.id && 
		this.src_slot.dt.id !== any_dt.id && 
		this.dst_slot.dt.id !== any_dt.id)
	{
		msg('ERROR: Connection data type mismatch - dropping connection.')
		console.log('Connection that failed', this)
		return false
	}
	
	this.src_node.addOutput(this)
	this.dst_node.addInput(this)

	this.dst_slot.is_connected = this.src_slot.is_connected = true

	return true
}

Connection.hydrate = function(graph, serialisedConnection) {
	var connection = new Connection()
	connection.deserialise(serialisedConnection)
	connection.patch_up(graph.nodes)
	return connection
}


if (typeof(module) !== 'undefined') {
	module.exports.Connection = Connection
	module.exports.ConnectionUI = ConnectionUI
}

