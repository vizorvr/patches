function Node(parent_graph, plugin_id, x, y)
{
	this.inputs = [];
	this.outputs = [];
	this.dyn_slot_uid = 0;
	this.queued_update = -1;
	
	if(plugin_id !== null) // Don't initialise if we're loading.
	{
		this.parent_graph = parent_graph;
		this.x = x;
		this.y = y;
		this.ui = null;
		this.id = E2.app.player.core.plugin_mgr.keybyid[plugin_id];
		this.uid = parent_graph.get_node_uid();
		this.update_count = 0;
		this.title = null;
		this.inputs_changed = false;
		this.open = true;
		
		this.set_plugin(E2.app.player.core.plugin_mgr.create(plugin_id, this));
	};
}

Node.prototype.set_plugin = function(plugin)
{
	this.plugin = plugin;
	this.plugin.updated = true;
	
	var init_slot = function(slot, index, type)
	{
		slot.index = index;
		slot.type = type;
		
		if(!slot.dt)
			msg('ERROR: The slot \'' + slot.name + '\' does not declare a datatype.');
	};
	
	// Decorate the slots with their index to make this immediately resolvable
	// from a slot reference, allowing for faster code elsewhere.
	// Additionally tagged with the type (0 = input, 1 = output) for similar reasons.
	for(var i = 0, len = plugin.input_slots.length; i < len; i++)
		init_slot(plugin.input_slots[i], i, E2.slot_type.input);
	
	for(var i = 0, len = plugin.output_slots.length; i < len; i++)
		init_slot(plugin.output_slots[i], i, E2.slot_type.output);
};
	
Node.prototype.create_ui = function()
{
	this.ui = new NodeUI(this, this.x, this.y);
};

Node.prototype.destroy_ui = function()
{
	if(this.ui)
	{
		this.ui.dom.remove();
		this.ui = null;
	}
};

Node.prototype.destroy = function()
{
	var graph = this.parent_graph;
	var index = graph.nodes.indexOf(this);
	var pending = [];
	
	if(this.plugin.destroy)
		this.plugin.destroy();
	
	graph.emit_event({ type: 'node-destroyed', node: this });
	
	if(index != -1)
		graph.nodes.splice(index, 1);
	
	pending.push.apply(pending, this.inputs);
	pending.push.apply(pending, this.outputs);
	
	for(var i = 0, len = pending.length; i < len; i++)
		graph.destroy_connection(pending[i]);
	
	if(this.plugin.e2_is_graph)
		this.plugin.graph.tree_node.remove();
	
	this.destroy_ui();
};

Node.prototype.get_disp_name = function()
{
	return this.title === null ? this.id : this.title;
};

Node.prototype.reset = function()
{
	var p = this.plugin;
	
	if(p.reset)
	{
		p.reset();
		p.updated = true;
	}
};

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

Node.prototype.add_slot = function(slot_type, def)
{
	var suid = this.dyn_slot_uid++;
	var is_inp = slot_type === E2.slot_type.input;
	def.uid = suid;
	
	if(is_inp)
	{
		if(!this.dyn_inputs)
			this.dyn_inputs = [];
		
		def.index = this.dyn_inputs.length;
		def.type = E2.slot_type.input;
		this.dyn_inputs.push(def);			
	}
	else
	{
		if(!this.dyn_outputs)
			this.dyn_outputs = [];
		
		def.index = this.dyn_outputs.length;
		def.type = E2.slot_type.output;
		this.dyn_outputs.push(def);			
	}
	
	if(this.ui)
	{
		var col = this.ui.dom.find(is_inp ? '.ic' : '.oc');
		
		NodeUI.create_slot(this, 'n' + this.uid, col, def, slot_type);
		this.update_connections();
	}
	
	return suid;
};

Node.prototype.remove_slot = function(slot_type, suid)
{
	var is_inp = slot_type === E2.slot_type.input;
	var slots = is_inp ? this.dyn_inputs : this.dyn_outputs;
	

	if(!slots)
		return;
	
	var slot = null;
	var idx = -1;

	for(var i = 0, len = slots.length; i < len; i++)
	{
		var s = slots[i];

		if(s.uid === suid)
		{
			slot = s;
			idx = i;
			slots.splice(i, 1)
			break;
		}
	} 

	if(!slot)
		return;
	
	if(slots.length < 1) // To prevent these to be serialised or allocated if all slots have been removed.
	{
		if(is_inp)
			this.dyn_inputs = undefined;
		else
			this.dyn_outputs = undefined;
	}
	else
	{
		// Patch up cached slot indices.
		for(var i = 0, len = slots.length; i < len; i++)
		{
			var s = slots[i];
		
			if(s.index > idx)
				s.index--;
		}
	}
	
	// Although impossible now, conceivably a plugin could create or destroy slots
	// in response to a clicked button on its control surface or something similar.
	if(this.ui)
		this.ui.dom.find('#n' + this.uid + (is_inp ? 'di' : 'do') + slot.uid).remove();
	
	var att = is_inp ? this.inputs : this.outputs;
	var pending = [];
	var canvas_dirty = false;
	
	for(var i = 0, len = att.length; i < len; i++)
	{
		var c = att[i];
		var s = is_inp ? c.dst_slot : c.src_slot;
	
		if(s === slot)
		{
			pending.push(c);
			
			if(c.ui)
				canvas_dirty = true;
		}
		else if(s.uid !== undefined && s.index > idx)
		{
			if(c.ui)
			{
				if(is_inp)
					E2.app.getSlotPosition(c.src_node, c.ui.dst_slot_div, E2.slot_type.input, c.ui.dst_pos);
				else
					E2.app.getSlotPosition(c.dst_node, c.ui.src_slot_div, E2.slot_type.output, c.ui.src_pos);
				
				canvas_dirty = true;
			}
		}
	}
	
	for(var i = 0, len = pending.length; i < len; i++)
	{
		pending[i].signal_change(false);
		this.parent_graph.destroy_connection(pending[i]);
	}
		
	if(canvas_dirty)
		E2.app.updateCanvas(true);
};


Node.prototype.find_dynamic_slot = function(slot_type, suid)
{
	var slots = (slot_type === E2.slot_type.input) ? this.dyn_inputs : this.dyn_outputs;
	
	if(slots)
	{
		for(var i = 0, len = slots.length; i < len; i++)
		{
			if(slots[i].uid === suid)
				return slots[i];
		}
	}

	return null;
};

Node.prototype.rename_slot = function(slot_type, suid, name)
{
	var slot = this.find_dynamic_slot(slot_type, suid);
	
	if(slot)
	{
		slot.name = name;

		if(this.ui)
			this.ui.dom.find('#n' + this.uid + (is_inp ? 'di' : 'do') + slot.uid).text(name);
	}
};
	
Node.prototype.change_slot_datatype = function(slot_type, suid, dt)
{
	var slot = this.find_dynamic_slot(slot_type, suid);
	var pg = this.parent_graph;
	
	if(slot.dt === dt) // Anything to do?
		return false;
	
	if(slot.dt !== pg.core.datatypes.ANY)
	{
		// Destroy all attached connections.
		var conns = slot_type === E2.slot_type.input ? this.inputs : this.outputs;
		var pending = [];
		var c = null;
	
		for(var i = 0, len = conns.length; i < len; i++)
		{
			c = conns[i];
		
			if(c.src_node === this || c.dst_node === this)
				pending.push(c);
		}

		for(var i = 0, len = pending.length; i < len; i++)
			pg.destroy_connection(pending[i]);
	}
		
	slot.dt = dt;
	return true;
};

Node.prototype.add_input = function(conn)
{
	var inserted = false;
	
	// Ensure that the order of inbound connections are stored ordered by the indices
	// of the slots they're connected to, so that we process them in this order also.
	for(var i = 0, len = this.inputs.length; i < len; i++)
	{
		var c = this.inputs[i];
		
		if(c.dst_slot.index > conn.dst_slot.index)
		{
			inserted = true;
			this.inputs.splice(i, 0, conn);
			break;
		}
	}
	
	if(!inserted)
		this.inputs.push(conn);
};

Node.prototype.update_connections = function()
{
	var gsp = E2.app.getSlotPosition;
	
	for(var i = 0, len = this.outputs.length; i < len; i++)
	{
		var c = this.outputs[i];
		
		gsp(c.src_node, c.ui.src_slot_div, E2.slot_type.output, c.ui.src_pos);
	}
	
	for(var i = 0, len = this.inputs.length; i < len; i++)
	{
		var c = this.inputs[i];
		
		gsp(c.dst_node, c.ui.dst_slot_div, E2.slot_type.input, c.ui.dst_pos);
	}
	
	return this.inputs.length + this.outputs.length;
};

Node.prototype.update_recursive = function(conns)
{
	var dirty = false;

	if(this.update_count < 1)
	{
		var inputs = this.inputs;
		var pl = this.plugin;
		var needs_update = this.inputs_changed || pl.updated;
	
		for(var i = 0, len = inputs.length; i < len; i++)
		{
			var inp = inputs[i];
			
			if(inp.dst_slot.inactive)
				continue;
			
			var sn = inp.src_node;
			 
			dirty = sn.update_recursive(conns) || dirty;
		
			// TODO: Sampling the output value out here might seem spurious, but isn't:
			// Some plugin require the ability to set their updated flag in update_output().
			// Ideally, these should be reqritten to not do so, and this state should
			// be moved into the clause below to save on function calls.
			var value = sn.plugin.update_output(inp.src_slot);

			if(sn.plugin.updated && (!sn.plugin.query_output || sn.plugin.query_output(inp.src_slot)))
			{
				pl.update_input(inp.dst_slot, value);
				pl.updated = true;
				needs_update = true;
		
				if(inp.ui && !inp.ui.flow)
				{
					dirty = true;
					inp.ui.flow = true;
				}
			}
			else if(inp.ui && inp.ui.flow)
			{
				inp.ui.flow = false;
				dirty = true;
			}
		}
	
		if(pl.always_update || (pl.e2_is_graph && pl.state.always_update))
		{
			pl.update_state();
		}			
		else if(this.queued_update > -1)
		{
			if(pl.update_state)
				pl.update_state();

			pl.updated = true;
			this.queued_update--;
		}
		else if(needs_update || (pl.output_slots.length === 0 && (!this.outputs || this.outputs.length === 0)))
		{
			if(pl.update_state)
				pl.update_state();
		
			this.inputs_changed = false;
		}
		else if(pl.input_slots.length === 0 && (!this.inputs || this.inputs.length === 0))
		{
			if(pl.update_state)
				pl.update_state();
		}
	}
	
	this.update_count++;

	return dirty;
};

Node.prototype.serialise = function()
{
	var d = {};
	
	d.plugin = this.plugin.id;
	d.x = Math.round(this.x);
	d.y = Math.round(this.y);
	d.uid = this.uid;
	
	if(!this.open)
		d.open = this.open;
	
	if(this.dyn_slot_uid)
		d.dsid = this.dyn_slot_uid;
	
	if(this.plugin.state)
		d.state = this.plugin.state;

	if(this.title)
		d.title = this.title;
	
	if(this.plugin.e2_is_graph)
		d.graph = this.plugin.graph.serialise();
	
	if(this.dyn_inputs || this.dyn_outputs)
	{
		var pack_dt = function(slots)
		{
			for(var i = 0, len = slots.length; i < len; i++)
				slots[i].dt = slots[i].dt.id;
		};
		
		if(this.dyn_inputs)
		{
			d.dyn_in = clone(this.dyn_inputs);
			pack_dt(d.dyn_in);
		}
		
		if(this.dyn_outputs)
		{
			d.dyn_out = clone(this.dyn_outputs);
			pack_dt(d.dyn_out);
		}
	}

	return d;
};

Node.prototype.deserialise = function(guid, d)
{
	this.parent_graph = guid;
	this.x = d.x;
	this.y = d.y;
	this.id = E2.app.player.core.plugin_mgr.keybyid[d.plugin];
	this.uid = d.uid;
	this.open = d.open !== undefined ? d.open : true;
	
	if(d.dsid)
		this.dyn_slot_uid = d.dsid;
	
	this.title = d.title ? d.title : null;
	
	var plg = E2.app.player.core.plugin_mgr.create(d.plugin, this);
	
	if(plg === null)
	{
		msg('ERROR: Failed to instance node of type \'' + d.plugin + '\' with title \'' + this.title + '\' and UID = ' + this.uid + '.');
		return false;
	}
	
	this.set_plugin(plg);
	
	if(this.plugin.e2_is_graph)
	{
		this.plugin.graph = new Graph(E2.app.player.core, null, null);
		this.plugin.graph.plugin = this.plugin;
		this.plugin.graph.deserialise(d.graph);
		this.plugin.graph.reg_listener(this.plugin.graph_event(this.plugin));
		E2.app.player.core.graphs.push(this.plugin.graph);
	}
	
	if(d.state && this.plugin.state)
	{
		for(var key in d.state)
		{
			if(!d.state.hasOwnProperty(key))
				continue;
				
			if(key in this.plugin.state)
				this.plugin.state[key] = d.state[key];
		}
	}
	
	if(d.dyn_in || d.dyn_out)
	{
		var patch_slot = function(slots, type)
		{
			var rdt = E2.app.player.core.resolve_dt;
			
			for(var i = 0, len = slots.length; i < len; i++)
			{
				var s = slots[i];
				 
				s.dt = rdt[s.dt];
				s.type = type;
			}
		};
		
		if(d.dyn_in)
		{
			this.dyn_inputs = d.dyn_in;
			patch_slot(this.dyn_inputs, E2.slot_type.input);
		}
		
		if(d.dyn_out)
		{
			this.dyn_outputs = d.dyn_out;
			patch_slot(this.dyn_outputs, E2.slot_type.output);
		}
	}
	
	return true;
};

Node.prototype.patch_up = function(graphs)
{
	this.parent_graph = Graph.resolve_graph(graphs, this.parent_graph);

	if(this.plugin.e2_is_graph)
		this.plugin.graph.patch_up(graphs);
};

Node.prototype.initialise = function()
{
	if(this.plugin.state_changed)
		this.plugin.state_changed(null);

	if(this.plugin.e2_is_graph)
		this.plugin.graph.initialise();
};

function LinkedSlotGroup(core, parent_node, inputs, outputs)
{
	this.core = core;
	this.node = parent_node;
	this.inputs = inputs;
	this.outputs = outputs;
	this.n_connected = 0;
	this.dt = core.datatypes.ANY;
}

LinkedSlotGroup.prototype.set_dt = function(dt)
{
	this.dt = dt;
	
	for(var i = 0, len = this.inputs.length; i < len; i++)
		this.inputs[i].dt = dt;

	for(var i = 0, len = this.outputs.length; i < len; i++)
		this.outputs[i].dt = dt;
};

LinkedSlotGroup.prototype.add_dyn_slot = function(slot)
{
	(slot.type === E2.slot_type.input ? this.inputs : this.outputs).push(slot);
};

LinkedSlotGroup.prototype.remove_dyn_slot = function(slot)
{
	(slot.type === E2.slot_type.input ? this.inputs : this.outputs).remove(slot);
};

LinkedSlotGroup.prototype.connection_changed = function(on, conn, slot)
{
	if(this.inputs.indexOf(slot) === -1 && this.outputs.indexOf(slot) === -1)
		return;
		
	this.n_connected += on ? 1 : -1;
	
	if(on && this.n_connected === 1)
	{
		this.set_dt((slot.type === E2.slot_type.input) ? conn.src_slot.dt : conn.dst_slot.dt);
		return true;
	}
	
	if(!on && this.n_connected === 0)
	{
		this.set_dt(this.core.datatypes.ANY);
		return true;
	}
	
	return false;
};

LinkedSlotGroup.prototype.infer_dt = function()
{
	var node = this.node;
	var dt = null;
	var any_dt = this.core.datatypes.ANY;
	
	for(var i = 0, len = node.inputs.length; i < len; i++)
	{
		var c = node.inputs[i];
		
		if(this.inputs.indexOf(c.dst_slot) !== -1)
		{
			dt = c.src_slot.dt !== any_dt ? c.src_slot.dt : dt;
			this.n_connected++;
		}
	}

	for(var i = 0, len = node.outputs.length; i < len; i++)
	{
		var c = node.outputs[i];
		
		if(this.outputs.indexOf(c.src_slot) !== -1)
		{
			dt = c.dst_slot.dt !== any_dt ? c.dst_slot.dt : dt;
			this.n_connected++;
		}
	}
	
	if(dt !== null)
	{
		this.set_dt(dt);
		return this.core.get_default_value(dt);
	}
	
	return null;
};
