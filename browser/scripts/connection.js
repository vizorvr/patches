function ConnectionUI(parent_conn)
{
	this.src_pos = [0, 0];
	this.dst_pos = [0, 0];
	this.src_slot_div = null;
	this.dst_slot_div = null;
	this.flow = false;
	this.selected = false;
	this.deleting = false;
	this.parent_conn = parent_conn;
	this.color = '#000';
}

ConnectionUI.prototype.resolve_slot_divs = function()
{
	var pc = this.parent_conn;
	
	this.src_slot_div = pc.src_node.ui.dom.find('#n' + pc.src_node.uid + (pc.src_slot.uid !== undefined ? 'do' + pc.src_slot.uid : 'so' + pc.src_slot.index));
	this.dst_slot_div = pc.dst_node.ui.dom.find('#n' + pc.dst_node.uid + (pc.dst_slot.uid !== undefined ? 'di' + pc.dst_slot.uid : 'si' + pc.dst_slot.index));

	E2.app.getSlotPosition(pc.src_node, this.src_slot_div, E2.slot_type.output, this.src_pos);
	E2.app.getSlotPosition(pc.dst_node, this.dst_slot_div, E2.slot_type.input, this.dst_pos);
};

function Connection(src_node, dst_node, src_slot, dst_slot)
{
	this.src_node = src_node;
	this.dst_node = dst_node;
	this.src_slot = src_slot;
	this.dst_slot = dst_slot;
	this.ui = null;
	this.offset = 0;
}

Connection.prototype.create_ui = function()
{
	this.ui = new ConnectionUI(this);
};

Connection.prototype.destroy_ui = function()
{
	if(this.ui)
		this.ui = null;
};

Connection.prototype.reset = function()
{
	if(this.ui && this.ui.flow)
	{
		this.ui.flow = false;
		this.ui.color = '#000';
	}
};

Connection.prototype.r_update_inbound = function(node)
{
	node.queued_update = 1;
	
	if(node.plugin.id !== 'input_proxy')
	{
		for(var i = 0, len = node.inputs.length; i < len; i++)
			this.r_update_inbound(node.inputs[i].src_node);
	}
	else
	{
		var rp = node.parent_graph.plugin;
		
		if(rp && rp.parent_node.queued_update < 0 && rp.state.enabled)
			this.r_update_inbound(rp.parent_node);
	}
}

Connection.prototype.r_update_outbound = function(node)
{
	node.queued_update = 1;
	
	if(node.plugin.id !== 'output_proxy')
	{
		for(var i = 0, len = node.outputs.length; i < len; i++)
			this.r_update_outbound(node.outputs[i].dst_node);
	}
	else
	{
		var rp = node.parent_graph.plugin;
		
		if(rp && rp.parent_node.queued_update < 0 && rp.state.enabled)
			this.r_update_outbound(rp.parent_node);
	}
}

Connection.prototype.signal_change = function(on)
{
	var n = this.src_node;
	
	if(n.plugin.connection_changed)
	{
		n.plugin.connection_changed(on, this, this.src_slot);
		
		if(n.plugin.reset)
			n.plugin.reset();
	}
	
	n = this.dst_node;
	n.inputs_changed = true;
	
	if(!on && n.plugin.update_input)
	{
		if(this.dst_slot.uid === undefined)
		{
			if(this.dst_slot.def !== undefined)
			{
				n.plugin.update_input(this.dst_slot, clone(this.dst_slot.def));
				n.plugin.updated = true;
			}
		}
		else
		{
			n.plugin.update_input(this.dst_slot, E2.app.player.core.get_default_value(this.dst_slot.dt));
			n.plugin.updated = true;
		}
	}
	
	if(n.plugin.connection_changed)
	{
		n.plugin.connection_changed(on, this, this.dst_slot);
		n.plugin.updated = true;
	}
	
	if(on)
	{
		for(var i = 0, len = n.inputs.length; i < len; i++)
			n.inputs[i].src_node.queued_update = 1;

		// this.r_update_inbound(n);
		this.r_update_outbound(n);
	}
};

Connection.prototype.serialise = function()
{
	var d = {};
	
	d.src_nuid = this.src_node.uid;
	d.dst_nuid = this.dst_node.uid;
	d.src_slot = this.src_slot.index;
	d.dst_slot = this.dst_slot.index;
	
	d.src_connected = this.src_slot.connected;
	d.dst_connected = this.dst_slot.connected;
	
	if(this.src_slot.uid !== undefined)
		d.src_dyn = true;
	
	if(this.dst_slot.uid !== undefined)
		d.dst_dyn = true;

	if(this.offset !== 0)
		d.offset = this.offset;
	
	return d;
};

Connection.prototype.deserialise = function(d)
{
	this.src_node = d.src_nuid;
	this.dst_node = d.dst_nuid;
	this.src_slot = { index: d.src_slot, dynamic: d.src_dyn ? true : false, connected: d.src_connected };
	this.dst_slot = { index: d.dst_slot, dynamic: d.dst_dyn ? true : false, connected: d.dst_connected };
	this.offset = d.offset ? d.offset : 0;
};

Connection.prototype.patch_up = function(nodes)
{
	var resolve_node = function(nuid)
	{
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			if(nodes[i].uid === nuid)
				return nodes[i];
		}
		
		msg('ERROR: Failed to resolve node with uid = ' + nuid);
		return null;
	};
	
	this.src_node = resolve_node(this.src_node);
	this.dst_node = resolve_node(this.dst_node);
	
	if(!this.src_node || !this.dst_node)
	{
		msg('ERROR: Source or destination node invalid - dropping connection.');
		return false;
	}
	
	this.src_slot = (this.src_slot.dynamic ? this.src_node.dyn_outputs : this.src_node.plugin.output_slots)[this.src_slot.index];
	this.dst_slot = (this.dst_slot.dynamic ? this.dst_node.dyn_inputs : this.dst_node.plugin.input_slots)[this.dst_slot.index];
	
	if(!this.src_slot || !this.dst_slot)
	{
		msg('ERROR: Source or destination slot invalid - dropping connection.');
		return false;
	}
	
	var any_dt = E2.app.player.core.datatypes.ANY;
	
	if(this.src_slot.dt !== this.dst_slot.dt && 
	   this.src_slot.dt !== any_dt && 
	   this.dst_slot.dt !== any_dt)
	{
		msg('ERROR: Connection data type mismatch - dropping connection.');
		return false;
	}
	
	this.dst_slot.is_connected = true;
	
	if(this.src_slot.connected)
		this.src_slot.connected = true;

	if(this.dst_slot.connected)
		this.dst_slot.connected = true;

	this.src_node.outputs.push(this);
	this.dst_node.add_input(this);
	
	return true;
};

