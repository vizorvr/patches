/**
 * a Node in a patching graph
 * @emits openStateChanged, pluginStateChanged, slotAdded, slotRemoved
 * @constructor
 */
function Node(parent_graph, plugin_id, x, y) {
	EventEmitter.call(this)

	this.x = 0;
	this.y = 0;
	this.inputs = []
	this.outputs = []
	this.queued_update = -1
	this.dyn_inputs = []
	this.dyn_outputs = []

	this.uid = E2.uid()

	if (plugin_id) { // Don't initialise if we're loading.
		this.parent_graph = parent_graph;
		this.x = x;
		this.y = y;
		this.ui = null;
		this.id = E2.core.pluginManager.keybyid[plugin_id];
		this.update_count = 0;
		this.title = null;
		this.inputs_changed = false;
		this.open = true;

		this.set_plugin(E2.core.pluginManager.create(plugin_id, this))
	}
}

Node.prototype = Object.create(EventEmitter.prototype)

Node.prototype.getConnections = function() {
	return this.inputs.concat(this.outputs)
}

Node.prototype.getDynamicInputSlots = function() {
	return this.dyn_inputs;
}

Node.prototype.getDynamicOutputSlots = function() {
	return this.dyn_outputs;
}

Node.prototype.set_plugin = function(plugin) {
	this.plugin = plugin;
	this.plugin.updated = true;
	
	if (!plugin.input_slots)
		debugger;

	function init_slot(slot, index, type) {
		slot.index = index;
		slot.type = type;
		
		if(!slot.dt)
			msg('ERROR: The slot \'' + slot.name + '\' does not declare a datatype.');
	}
	
	// Decorate the slots with their index to make this immediately resolvable
	// from a slot reference, allowing for faster code elsewhere.
	// Additionally tagged with the type (0 = input, 1 = output) for similar reasons.
	for(var i = 0, len = plugin.input_slots.length; i < len; i++)
		init_slot(plugin.input_slots[i], i, E2.slot_type.input);
	
	for(var i = 0, len = plugin.output_slots.length; i < len; i++)
		init_slot(plugin.output_slots[i], i, E2.slot_type.output);

	// back reference for object picking
	this.plugin.parentNode = this
};

Node.prototype.setOpenState = function(isOpen) {
	this.open = isOpen
	this.emit('openStateChanged', isOpen)
}
	
Node.prototype.create_ui = function() {
	this.ui = new NodeUI(this, this.x, this.y)
}

Node.prototype.destroy_ui = function() {
	if (!this.ui)
		return;

	if (this.ui.destroy)
		this.ui.destroy()

	this.ui = null

	if (this.plugin.destroy_ui)
		this.plugin.destroy_ui()
}

Node.prototype.destroy = function()
{
	var graph = this.parent_graph;
	var index = graph.nodes.indexOf(this);
	var pending = [];
	
	if (this.plugin.destroy)
		this.plugin.destroy();
	
	if (index !== -1)
		graph.nodes.splice(index, 1);
	
	pending.push.apply(pending, this.inputs);
	pending.push.apply(pending, this.outputs);
	
	for(var i = 0, len = pending.length; i < len; i++)
		graph.disconnect(pending[i]);
	
	this.destroy_ui();
};

Node.prototype.get_disp_name = function() {
	return !this.title ? this.id : this.title;
}

Node.prototype.reset = function() {
	var p = this.plugin

	if (p.reset) {
		p.reset()
		p.updated = true
	}
}

Node.prototype.geometry_updated = function()
{
	if(this.outputs.length < 1)
		return;
	
	for(var i = 0, len = this.outputs.length; i < len; i++)
	{
		var c = this.outputs[i];
		
		E2.app.getSlotPosition(c.src_node, c.ui.src_slot_div, E2.slot_type.output, c.ui.src_pos);
	}
	
	E2.app.updateCanvas(true);
};

Node.prototype.add_slot = function(slot_type, def) {
	var is_inp = slot_type === E2.slot_type.input;
	var slots = is_inp ? this.dyn_inputs : this.dyn_outputs;

	if (def.uid === undefined || def.uid === null)
		def.uid = E2.uid()

	if (!def.dt) {
		msg('ERROR: No datatype given for slot')
		console.trace('No datatype given for slot')
		return false
	}

	if (!def.name) {
		msg('ERROR: No name given for slot')
		console.trace('No name given for slot')
		return false
	}

	def.dynamic = true
	def.type = slot_type

	if (def.index === undefined)
		def.index = slots.length

	slots.splice(def.index, 0, def);

	for(var i = 0, len = slots.length; i < len; i++) {
		slots[i].index = i
	}

	this.emit('slotAdded', def)
	
	return def.uid;
};

Node.prototype.remove_slot = function(slot_type, suid) {
	var is_inp = slot_type === E2.slot_type.input;
	var slots = is_inp ? this.dyn_inputs : this.dyn_outputs;

	if (!slots.length)
		return;
	
	var slot = null;
	var idx = -1;

	for(var i = 0, len = slots.length; i < len; i++) {
		var s = slots[i];

		if (s.uid === suid) {
			slot = s;
			idx = i;

			slots.splice(i, 1)
			break;
		}
	} 

	if (!slot)
		return;
	
	if (slots.length) {
		// Patch up cached slot indices.
		for(var i = 0, len = slots.length; i < len; i++) {
			slots[i].index = i
		}
	}
	
	if (this.ui) {
		this.ui.redrawSlots();
	}
	
	var att = is_inp ? this.inputs : this.outputs;
	var pending = [];
	var canvas_dirty = false;
	
	for(var i = 0, len = att.length; i < len; i++) {
		var c = att[i];
		var s = is_inp ? c.dst_slot : c.src_slot;
	
		if (s === slot) {
			pending.push(c);
		}
	}
	
	for(var i = 0, len = pending.length; i < len; i++) {
		this.parent_graph.disconnect(pending[i]);
	}
		
	this.emit('slotRemoved', slot)

};

Node.prototype.findSlotByUid = function(suid) {
	var slot

	this.dyn_inputs.concat(this.dyn_outputs)
	.some(function(s) {
		if (s.uid === suid) {
			slot = s
			return true
		}
	})

	if (!slot)
		console.error('Slot not found', suid)

	return slot
}

Node.prototype.find_dynamic_slot = function(slot_type, suid) {
	var slots = (slot_type === E2.slot_type.input) ? this.dyn_inputs : this.dyn_outputs;

	for(var i = 0, len = slots.length; i < len; i++) {
		if (slots[i].uid === suid)
			return slots[i];
	}

	console.error('Slot not found', slot_type, suid)
}

Node.prototype.rename_slot = function(slot_type, suid, name) {
	var slot = this.find_dynamic_slot(slot_type, suid);
	var renamed = false;
	if (slot) {
		slot.name = name;
		if (this.ui) {
			renamed = this.ui.renameSlot(slot, name, suid, slot_type);
		}
	}
	return renamed;
}
	
Node.prototype.change_slot_datatype = function(slot_type, suid, dt, arrayness) {
	var slot = this.find_dynamic_slot(slot_type, suid);
	var pg = this.parent_graph;

	slot.array = arrayness
	
	if (slot.dt.id === dt.id) // Anything to do?
		return false;
	
	if (slot.dt.id !== pg.core.datatypes.ANY.id) {
		// Destroy all attached connections.
		var conns = slot_type === E2.slot_type.input ? this.inputs : this.outputs;
		var pending = [];
		var c = null;

		for(var i = 0, len = conns.length; i < len; i++) {
			c = conns[i];
		
			if(c.src_node === this || c.dst_node === this)
				pending.push(c);
		}

		for(var i = 0, len = pending.length; i < len; i++)
			pg.disconnect(pending[i]);
	}
		
	slot.dt = dt;
	return true;
};

Node.prototype.addInput = function(newConn) {
	// Ensure that the order of inbound connections are stored ordered by the indices
	// of the slots they're connected to, so that we process them in this order also.
	var inserted = this.inputs.some(function(ec, i) {
		if (ec.dst_slot.index > newConn.dst_slot.index) {
			this.inputs.splice(i, 0, newConn)
			return true;
		}
	}.bind(this))
	
	if (!inserted)
		this.inputs.push(newConn)
}

Node.prototype.addOutput = function(conn) {
	this.outputs.push(conn)
}

Node.prototype.removeOutput = function(conn) {
	conn.dst_slot.is_connected = false
	this.outputs.splice(this.outputs.indexOf(conn), 1)
}

Node.prototype.removeInput = function(conn) {
	conn.dst_slot.is_connected = false
	this.inputs.splice(this.inputs.indexOf(conn), 1)
}

Node.prototype.update_connections = function() {
	this.outputs.forEach(function(c) {
		E2.app.getSlotPosition(c.src_node, c.ui.src_slot_div, E2.slot_type.output, c.ui.src_pos)
	})
	
	this.inputs.forEach(function(c) {
		E2.app.getSlotPosition(c.dst_node, c.ui.dst_slot_div, E2.slot_type.input, c.ui.dst_pos)
	})
	
	return this.inputs.length + this.outputs.length
}

/**
 * set connection UI flow state to off recursively
 */
Node.prototype._cascadeFlowOff = function(conn) {
	conn.ui.flow = false

	if (conn.src_node.inputs.length) {
		for (var i=0; i < conn.src_node.inputs.length; i++) {
			if (conn.src_node.inputs[i].ui.flow)
				this._cascadeFlowOff(conn.src_node.inputs[i])
		}
	}
}

Node.prototype._update_input = function(inp, pl, conns, needs_update) {
	var result = {dirty: false, needs_update: needs_update}
	var sn = inp.src_node;

	result.dirty = sn.update_recursive(conns);

	// TODO: Sampling the output value out here might seem spurious, but isn't:
	// Some plugin require the ability to set their updated flag in update_output().
	// Ideally, these should be rewritten to not do so, and this state should
	// be moved into the clause below to save on function calls.
	var value = sn.plugin.update_output(inp.src_slot);

	if (sn.plugin.updated && (!sn.plugin.query_output || sn.plugin.query_output(inp.src_slot))) {
		if (inp.dst_slot.array && !inp.src_slot.array) {
			value = [value]
		} else if (!inp.dst_slot.array && inp.src_slot.array) {
			value = value[0]
		}

		pl.update_input(inp.dst_slot, inp.dst_slot.validate ? inp.dst_slot.validate(value) : value);

		pl.updated = true;
		result.needs_update = true;

		if (inp.ui && !inp.ui.flow) {
			result.dirty = true;
			inp.ui.flow = true;
		}
	} else if(inp.ui && inp.ui.flow) {
		inp.ui.flow = false;
		result.dirty = true;
	}

	return result
}

Node.prototype.update_recursive = function(conns) {
	var dirty = false;

	if (this.update_count > 0)
		return dirty;

	this.update_count++;

	var inputs = this.inputs;
	var pl = this.plugin;
	var needs_update = this.inputs_changed || pl.updated;

	var secondPassUpdateInputs = []

	// input update step 1: collect inactive inputs before any inputs have been updated
	// (which could change the state of activeness on other inputs)
	for (var i = 0, len = inputs.length; i < len; ++i) {
		var inp = inputs[i]
		if (inp.dst_slot.inactive) {
			if (inp.ui && inp.ui.flow) {
				this._cascadeFlowOff(inp)
				dirty = true
			}
			secondPassUpdateInputs.push(inp)
		}
	}

	// input update step 2: first pass input update: update active inputs
	for (var i = 0, len = inputs.length; i < len; ++i) {
		var inp = inputs[i]

		if (inp.dst_slot.inactive) {
			continue;
		}

		var result = this._update_input(inp, pl, conns, needs_update)

		dirty = dirty || result.dirty
		needs_update = needs_update || result.needs_update
	}

	// input update step 3: second pass input update: recheck and update any inputs that were deactivated
	// before the first update
	for (var i = 0, len = secondPassUpdateInputs.length; i < len; ++i) {
		var inp = secondPassUpdateInputs[i]
		if (!inp.dst_slot.inactive) {
			// set reactivated inputs as updated so that their values are fetched
			inp.src_node.plugin.updated = true
			
			var result = this._update_input(inp, pl, conns, needs_update)

			dirty = dirty || result.dirty
			needs_update = needs_update || result.needs_update
		}
	}

	if (pl.always_update || (pl.isGraph && pl.state.always_update)) {
		pl.update_state();
	} else if(this.queued_update > -1) {
		if(pl.update_state)
			pl.update_state();

		pl.updated = true;
		this.queued_update--;
	} else if(needs_update || (pl.output_slots.length === 0 && (!this.outputs || this.outputs.length === 0))) {
		if(pl.update_state)
			pl.update_state();
	
		this.inputs_changed = false;
	} else if(pl.input_slots.length === 0 && (!this.inputs || this.inputs.length === 0)) {
		if(pl.update_state)
			pl.update_state();
	}
	
	return dirty;
}

Node.prototype.setPluginState = function(key, value) {
	this.plugin.state[key] = value

	this.plugin.updated = true
	this.plugin.dirty = true

	this.emit('pluginStateChanged', key, value)
}

Node.prototype.serialise = function(flat) {
	function pack_dt(slots) {
		for(var i = 0, len = slots.length; i < len; i++) {
			delete slots[i].desc;
			slots[i].dt = slots[i].dt.id;
		}
	}

	var d = {};
	
	d.plugin = this.plugin.id;
	d.x = Math.round(this.x);
	d.y = Math.round(this.y);
	d.uid = this.uid;
	
	if(!this.open)
		d.open = this.open;
	
	if(this.plugin.state)
		d.state = this.plugin.state;

	if(this.title)
		d.title = this.title;
	
	if (!flat && this.plugin.isGraph)
		d.graph = this.plugin.graph.serialise();
	
	if (this.dyn_inputs.length || this.dyn_outputs.length) {
		if(this.dyn_inputs.length) {
			d.dyn_in = clone(this.dyn_inputs);
			pack_dt(d.dyn_in);
		}
		
		if (this.dyn_outputs.length) {
			d.dyn_out = clone(this.dyn_outputs);
			pack_dt(d.dyn_out);
		}
	}

	return d;
};

// force all uid's and sids into strings. issue #135
Node.prototype.fixStateSidsIssue135 = function(state) {
	function stringifySids(sids) {
		Object.keys(sids).map(function(uid) {
			sids[''+uid] = ''+sids[uid]
		})
	}

	if (state.input_sids)
		stringifySids(state.input_sids)

	if (state.output_sids)
		stringifySids(state.output_sids)
}

Node.prototype.deserialise = function(guid, d) {
	var idMap = {
		'register_local_read': 'variable_local_read',
		'register_local_write': 'variable_local_write',
	}

	if (idMap[d.plugin])
		d.plugin = idMap[d.plugin]

	this.parent_graph = guid;
	this.x = d.x;
	this.y = d.y;
	this.id = E2.core.pluginManager.keybyid[d.plugin];
	this.uid = '' + d.uid;
	this.open = d.open !== undefined ? d.open : true;
	
	this.title = d.title ? d.title : null;
	
	var plg = E2.core.pluginManager.create(d.plugin, this);
	
	if (!plg) {
		msg('ERROR: Failed to instance node of type \'' + d.plugin + '\' with title \'' + this.title + '\' and UID = ' + this.uid + '.');
		return false;
	}
	
	this.set_plugin(plg);
	
	if (this.plugin.isGraph) {
		this.plugin.setGraph(new Graph(E2.core, null, null))
		this.plugin.graph.plugin = this.plugin;
		this.plugin.graph.deserialise(d.graph);

		if (E2.core.graphs.indexOf(this.plugin.graph) === -1)
			E2.core.graphs.push(this.plugin.graph);
	}
	
	if (d.state && this.plugin.state) {
		this.fixStateSidsIssue135(d.state)

		for(var key in d.state) {
			if(!d.state.hasOwnProperty(key))
				continue;
				
			if(key in this.plugin.state)
				this.plugin.state[key] = d.state[key];
		}
	}
	
	if (d.dyn_in || d.dyn_out) {
		function patch_slot(slots, type) {
			var rdt = E2.core.resolve_dt;
			
			for(var i = 0; i < slots.length; i++) {
				var s = slots[i];
				s.uid = '' + s.uid;
				s.dynamic = true;
				s.dt = rdt[s.dt];
				s.type = type;
			}
		}
		
		if (d.dyn_in) {
			this.dyn_inputs = d.dyn_in;
			patch_slot(this.dyn_inputs, E2.slot_type.input);
		}

		if (d.dyn_out) {
			this.dyn_outputs = d.dyn_out;
			patch_slot(this.dyn_outputs, E2.slot_type.output);
		}
	}

	return true;
};

Node.prototype.patch_up = function(graphs) {
	if (!(this.parent_graph instanceof Graph))
		this.parent_graph = Graph.resolve_graph(graphs, this.parent_graph);

	function initStructure(pg, n) {
		n.parent_graph = pg

		if (!n.plugin.isGraph)
			return;

		if (n.plugin.graph.uid === undefined)
			n.plugin.graph.uid = E2.core.get_uid()

		n.plugin.graph.parent_graph = pg

		var nodes = n.plugin.graph.nodes
		
		for(var i = 0, len = nodes.length; i < len; i++)
			initStructure(n.plugin.graph, nodes[i])
	}

	initStructure(this.parent_graph, this)
	
	if(this.plugin.isGraph)
		this.plugin.graph.patch_up(graphs);
};

Node.prototype.initialise = function()
{
	if(this.plugin.state_changed)
		this.plugin.state_changed(null);

	if(this.plugin.isGraph)
		this.plugin.graph.initialise();
};

Node.hydrate = function(guid, json) {
	var node = new Node()
	node.deserialise(guid, json)
	node.patch_up(E2.core.graphs)
	return node
}

Node.isGraphPlugin = function(pluginId) {
	return (['graph', 'loop', 'array_function'].indexOf(pluginId) > -1)
}


function LinkedSlotGroup(core, parent_node, inputs, outputs) {
	this.core = core;
	this.node = parent_node;
	this.inputs = inputs;
	this.outputs = outputs;
	this.n_connected = 0;
	this.dt = core.datatypes.ANY;
}

LinkedSlotGroup.prototype.setArrayness = function(arrayness) {
	for(var i = 0, len = this.inputs.length; i < len; i++) {
		this.inputs[i].array = arrayness
	}

	for(var i = 0, len = this.outputs.length; i < len; i++) {
		this.outputs[i].array = arrayness
	}
}

LinkedSlotGroup.prototype.set_dt = function(dt) {
	this.dt = dt;
	
	for(var i = 0, len = this.inputs.length; i < len; i++)
		this.inputs[i].dt = dt

	for(var i = 0, len = this.outputs.length; i < len; i++)
		this.outputs[i].dt = dt
}

LinkedSlotGroup.prototype.add_dyn_slot = function(slot) {
	(slot.type === E2.slot_type.input ? this.inputs : this.outputs).push(slot);
}

LinkedSlotGroup.prototype.remove_dyn_slot = function(slot) {
	var inOrOut = (slot.type === E2.slot_type.input ? this.inputs : this.outputs)
	var slotIdx = inOrOut.indexOf(slot)
	if (slotIdx > -1)
		inOrOut.splice(slotIdx, 1);
}

LinkedSlotGroup.prototype.connection_changed = function(on, conn, slot) {
	if (this.inputs.indexOf(slot) === -1 && this.outputs.indexOf(slot) === -1)
		return;
	
	this.n_connected += on ? 1 : -1;

	if (on && this.n_connected === 1) {
		var otherSlot = (slot.type === E2.slot_type.input) ? conn.src_slot : conn.dst_slot
		this.set_dt(otherSlot.dt)

		this.setArrayness(otherSlot.array)

		return true;
	}
	
	if(!on && this.n_connected === 0) {
		this.set_dt(this.core.datatypes.ANY);

		this.setArrayness(false)

		return true;
	}
	
	return false;
}

LinkedSlotGroup.prototype.infer_dt = function() {
	var node = this.node;
	var dt = null;
	var any_dt = this.core.datatypes.ANY.id;

	var anyConnectionIsArray = false

	for(var i = 0, len = node.inputs.length; i < len; i++) {
		var c = node.inputs[i];
		
		if(this.inputs.indexOf(c.dst_slot) !== -1) {
			dt = c.src_slot.dt.id !== any_dt ? c.src_slot.dt : dt;

			if (c.src_slot.array) {
				anyConnectionIsArray = true
			}

			this.n_connected++;
		}
	}

	for(var i = 0, len = node.outputs.length; i < len; i++) {
		var c = node.outputs[i];
		
		if(this.outputs.indexOf(c.src_slot) !== -1) {
			dt = c.dst_slot.dt.id !== any_dt ? c.dst_slot.dt : dt;

			if (c.dst_slot.array) {
				anyConnectionIsArray = true
			}
			this.n_connected++;
		}
	}

	this.setArrayness(anyConnectionIsArray)
	
	if (dt) {
		this.set_dt(dt);
		return this.core.get_default_value(dt);
	}
	
	return null;
};

LinkedSlotGroup.prototype.updateFreeSlots = function() {}


if (typeof(module) !== 'undefined') {
	module.exports.Node = Node
	module.exports.LinkedSlotGroup = LinkedSlotGroup
}


