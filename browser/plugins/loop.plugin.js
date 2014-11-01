E2.p = E2.plugins["loop"] = function(core, node)
{
	this.desc = 'Encapsulate a nested graph into- and out of which arbitrary data can be routed and run the enclosed logic once per loop iteration. The loop counter is made available to enclosing logic as a local register with the name <b>index<\/b>.';
	
	this.input_slots = [
		{ name: 'first', dt: core.datatypes.FLOAT, desc: 'The start index.', def: 0 },
		{ name: 'last', dt: core.datatypes.FLOAT, desc: 'The end index.', def: 0 },
		{ name: 'step', dt: core.datatypes.FLOAT, desc: 'Loop index increment.', def: 1 }
	];
	
	this.output_slots = [
	];
	
	this.state = { input_sids: {}, output_sids: {}, always_update: true };
		
	this.gl = core.renderer.context;
	this.core = core;
	this.input_nodes = {};
	this.output_nodes = {};
	this.parent_node = node; // For reverse lookup in the core.
	this.updated_sids = [];
	this.e2_is_graph = true; // Constant. To get rid of string compares from the core.
};

E2.p.prototype.reset = function()
{
	if(this.graph)
		this.graph.reset();
};

E2.p.prototype.play = function()
{
	if(this.graph)
		this.graph.pause();
};

E2.p.prototype.pause = function()
{
	if(this.graph)
		this.graph.pause();
};

E2.p.prototype.stop = function()
{
	if(this.graph)
		this.graph.stop();
};

E2.p.prototype.open_editor = function(self)
{
	var diag = make('div');
	var always_upd = $('<input id="always_upd" type="checkbox" title="If false, this graph is updated only when one of its inputs updates." />');
	var upd_lbl = $('<div>Always update:</div>');
	var r1 = make('div');

	var lbl_css = {
		'font-size': '14px',
		'float': 'left',
		'padding': '8px 0px 2px 2px',
	};
	
	var inp_css = {
		'float': 'right',
		'margin': '2px',
		'padding': '2px',
		'width': '13px',
		'margin-top': '8px'
	};

	diag.css({
		'margin': '0px',
		'padding': '2px',
	});

	r1.css('clear', 'both');
	always_upd.css(inp_css);
	upd_lbl.css(lbl_css);
	
	always_upd.attr('checked', self.state.always_update);
	
	r1.append(upd_lbl);
	r1.append(always_upd);
	diag.append(r1);
	
	var store_state = function(self, always_upd) { return function(e)
	{
		self.state.always_update = always_upd.is(":checked");
	}};
	
	self.core.create_dialog(diag, 'Edit Preferences.', 460, 250, store_state(self, always_upd));
};

E2.p.prototype.create_ui = function()
{
	var ui = make('div');
	var inp_edit = makeButton('Edit', 'Open this loop for editing.');
	
	inp_edit.click(function(self) { return function(e) 
	{
		if(self.graph)
			self.graph.tree_node.activate();
	}}(this));
	
	ui.css('text-align', 'center');
	ui.append(inp_edit);
	
	return ui;
};

E2.p.prototype.get_dt_name = function(dt)
{
	if(!dt || !dt.name)
		return 'ERROR';
		
	return dt.name;
};

E2.p.prototype.dbg = function(str)
{
	// msg('Graph: ' + str);
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(slot.uid !== undefined)
	{
		var psl = null;
		var core = this.core;
		
		if(!on)
		{
			if(slot.type === E2.slot_type.input)
			{
				var inode = this.input_nodes[slot.uid];
				
				psl = inode.dyn_outputs[0];
				inode.plugin.data = core.get_default_value(slot.dt);
				inode.reset();
			}
			else
			{
				var node = this.parent_node;
				var count = 0;
				
				for(var i = 0, len = node.outputs.length; i < len; i++)
				{
					if(node.outputs[i].src_slot === slot)
						count++;
				}
				
				if(count === 0)
					psl = this.output_nodes[slot.uid].dyn_inputs[0];
			}

			if(psl && !psl.connected)
			{
				psl.dt = slot.dt = core.datatypes.ANY;
				this.dbg('Resetting PDT/GDT for slot(' + slot.uid + ')');
			}
		}
		else
		{
			var tn = null;
			
			if(slot.type === E2.slot_type.input)
			{
				if(slot.dt === core.datatypes.ANY)
				{
					slot.dt = conn.src_slot.dt;
					this.dbg('Setting GDT for slot(' + slot.uid + ') to ' + this.get_dt_name(conn.src_slot.dt));
				}
				
				tn = this.input_nodes[slot.uid];
				psl = tn.dyn_outputs[0];
			}
			else
			{
				if(slot.dt === core.datatypes.ANY)
				{
					slot.dt = conn.dst_slot.dt;
					this.dbg('Setting GDT for slot(' + slot.uid + ') to ' + this.get_dt_name(conn.dst_slot.dt));
				}
				
				tn = this.output_nodes[slot.uid];
				psl = tn.dyn_inputs[0];
			}
			
			if(psl.dt === core.datatypes.ANY)
			{
				this.dbg('Setting PDT for slot(' + psl.uid + ') to ' + this.get_dt_name(slot.dt));
				psl.dt = slot.dt;
				tn.plugin.data = core.get_default_value(slot.dt);
			}
		}
	}
};

E2.p.prototype.proxy_connection_changed = function(on, p_node, t_node, slot, t_slot)
{
	var self = this;
	var core = this.core;
	var node = this.parent_node;
	
	var find_sid = function(nodes, uid)
	{
		for(var n in nodes)
		{		
			if(nodes[n].uid === uid)
				return parseInt(n);
		}
		
		msg('ERROR: Failed to resolve node(' + uid + ') in graph(' + self.graph.plugin.parent_node.title + ').');
		return -1;
	};
	
	var is_gslot_connected = function(gslot)
	{
		if(gslot.type === E2.slot_type.input)
		{
			for(var i = 0, len = node.inputs.length; i < len; i++)
			{
				if(node.inputs[i].dst_slot === gslot)
					return true;
			} 
		}
		else
		{
			for(var i = 0, len = node.outputs.length; i < len; i++)
			{
				if(node.outputs[i].src_slot === gslot)
					return true;
			} 
		}
		
		return false;
	};
	
	var change_slots = function(last, g_slot, p_slot)
	{
		if(!g_slot) // 'index' slot?
			return;
		
		self.dbg('Proxy slot change ' + on + ', last = ' + last + ', g_slot = ' + g_slot.uid + ', p_slot = ' + p_slot.uid);
		
		p_slot.connected = true;
		
		if(on)
		{
			if(p_slot.dt === core.datatypes.ANY)
			{
				p_slot.dt = t_slot.dt;		
				self.dbg('    Setting PDT to ' + self.get_dt_name(t_slot.dt) + '.');
			
				if(g_slot.dt === core.datatypes.ANY)
				{
					p_node.plugin.data = core.get_default_value(t_slot.dt);
				}
			}

			if(g_slot.dt === core.datatypes.ANY)
			{
				g_slot.dt = t_slot.dt;		
				self.dbg('    Setting GDT to ' + self.get_dt_name(t_slot.dt) + '.');
			}
		}
		else if(last)
		{
			var conns = node.parent_graph.connections;
			var connected = false;
			
			for(var i = 0, len = conns.length; i < len; i++)
			{
				var c = conns[i];
				
				if(c.dst_slot === g_slot || c.src_slot === g_slot)
				{
					connected = true;
					break;
				}
			}
			
			p_slot.connected = false;

			if(!connected)
			{
				p_slot.dt = g_slot.dt = core.datatypes.ANY;
				self.dbg('    Reverting to PDT/GDT to ANY.');
			}

			if(t_node.plugin.id === 'input_proxy')
			{
				connected = false;
				
				for(var i = 0, len = t_node.outputs.length; i < len; i++)
				{
					if(t_node.outputs[i].src_slot === t_slot)
					{
						connected = true;
						break;
					}
				}
				
				var rgsl = node.find_dynamic_slot(E2.slot_type.input, find_sid(self.input_nodes, t_node.uid));
				
				if(!connected && !is_gslot_connected(rgsl))
				{
					t_slot.dt = rgsl.dt = core.datatypes.ANY;
					self.dbg('    Reverting remote proxy slot to PDT/GDT to ANY.');
				}
			}
			else if(t_node.plugin.id === 'output_proxy')
			{
				var rgsl = node.find_dynamic_slot(E2.slot_type.output, find_sid(self.output_nodes, t_node.uid));
				
				if(!is_gslot_connected(rgsl))
				{
					t_slot.dt = rgsl.dt = core.datatypes.ANY;
					self.dbg('    Reverting remote proxy slot to PDT/GDT to ANY.');
				}
			}
		}
	};
	
	if(p_node.plugin.id === 'input_proxy')
	{
		var last = p_node.outputs.length === 0;
		
		change_slots(last, node.find_dynamic_slot(E2.slot_type.input, find_sid(this.input_nodes, p_node.uid)), slot);
		this.dbg('    Output count = ' + p_node.outputs.length);
	}
	else
	{
		var last = p_node.inputs.length === 0;
		
		change_slots(last, node.find_dynamic_slot(E2.slot_type.output, find_sid(this.output_nodes, p_node.uid)), slot);
		this.dbg('    Input count = ' + p_node.inputs.length);
	}
};

E2.p.prototype.register_dt_changed = function(dt)
{
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.uid === undefined)
	{
		if(slot.index === 0)
			this.first = Math.floor(data);
		else if(slot.index === 1)
			this.last = Math.floor(data);
		else
		{
			this.step = Math.abs(data);
			this.step = this.step < 1.0 ? 1 : Math.floor(this.step);
		}
	}
	else
	{
		this.input_nodes[slot.uid].plugin.input_updated(data)
	}
};

E2.p.prototype.update_state = function()
{
	this.updated = false;
	this.updated_sids.length = 0;
	
	if(this.first > this.last)
	{
		var t = this.first;
		
		this.first = this.last;
		this.last = t;
	}
	
	if(this.graph && this.step > 0)
	{
		var updated = false;
		
		for(var cnt = this.first; cnt < this.last; cnt += this.step)
		{
			this.graph.registers.write('index', cnt);
			this.graph.reset();
			
			if(this.graph.update())
				updated = true;
		}

		if(updated && this === E2.app.player.core.active_graph)
			E2.app.updateCanvas(false);
	}
};

E2.p.prototype.update_output = function(slot)
{
	if(slot.uid !== undefined)
		return this.output_nodes[slot.uid].plugin.data;
		
	this.updated = true; // Oooh!
	return this.texture;
};

E2.p.prototype.query_output = function(slot)
{
	return (slot.uid === undefined) || this.updated_sids.indexOf(slot.uid) > -1;
};

E2.p.prototype.destroy_slot = function(type, nuid)
{
	var slots = (type === E2.slot_type.input) ? this.state.input_sids : this.state.output_sids;
	var sid = slots[nuid];
	
	delete slots[nuid];
	this.parent_node.remove_slot(type, sid);
};

E2.p.prototype.graph_event = function(self) { return function(ev)
{
	var pid = ev.node.plugin.id;
	var core = self.core;
	var node = self.parent_node;
	
	if(pid !== 'input_proxy' && pid !== 'output_proxy')
		return;
	
	self.dbg('Gevent type = ' + ev.type + ', node uid = ' + ev.node.uid);
	
	if(ev.type === 'node-created')
	{
		if(pid === 'input_proxy')
		{
			var sid = node.add_slot(E2.slot_type.input, { name: '' + ev.node.title, dt: core.datatypes.ANY });
			
			self.state.input_sids[ev.node.uid] = sid;
			self.input_nodes[sid] = ev.node;
		}
		else if(pid === 'output_proxy')
		{
			var sid = node.add_slot(E2.slot_type.output, { name: '' + ev.node.title, dt: core.datatypes.ANY });
			
			self.state.output_sids[ev.node.uid] = sid;
			self.output_nodes[sid] = ev.node;
		}
	}
	else if(ev.type === 'node-destroyed')
	{
		if(pid === 'input_proxy')
			self.destroy_slot(E2.slot_type.input, ev.node.uid);
		else if(pid === 'output_proxy')
			self.destroy_slot(E2.slot_type.output, ev.node.uid);
	}
	else if(ev.type === 'node-renamed')
	{
		if(pid === 'input_proxy')
		{
			node.rename_slot(E2.slot_type.input, self.state.input_sids[ev.node.uid], ev.node.title);
		}
		else if(pid === 'output_proxy')
			node.rename_slot(E2.slot_type.output, self.state.output_sids[ev.node.uid], ev.node.title);
	}
}};

E2.p.prototype.state_changed = function(ui)
{
	var core = this.core;
	var node = this.parent_node;
	var self = this;
	
	// Only rebuild the node lists during post-load patch up of the graph, 
	// during which 'ui' will be null. Otherwise the lists would have been rebuilt 
	// every time we switch to the graph containing this node in the editor.
	if(ui)
	{
		// Decorate the auto generated dom base element with an
		// additional class to allow custom styling.
		node.ui.dom.addClass('graph');
		
		var inp_config = makeButton(null, 'Edit preferences.', 'config_btn');

		inp_config.click(function(self) { return function(e) 
		{
			self.open_editor(self);
		}}(this));
		
		$(node.ui.dom[0].children[0].children[0].children[0]).append(inp_config);
		return;
	}
	
	var find_node = function(nodes, uid)
	{
		for(var i = 0, len = nodes.length; i < len; i++)
		{
			if(nodes[i].uid === uid)
			{
				var n = nodes[i];
				var p = n.plugin;
				
				p.data = core.get_default_value((p.id === 'input_proxy' ? n.dyn_outputs : n.dyn_inputs)[0].dt);
				return n;
			}
		}

		msg('ERROR: Failed to find registered proxy node(' + uid + ') in graph(' + self.graph.plugin.parent_node.title + ').'); 
		return null;
	};

	for(var uid in this.state.input_sids)
		this.input_nodes[this.state.input_sids[uid]] = find_node(this.graph.nodes, parseInt(uid));

	for(var uid in this.state.output_sids)
		this.output_nodes[this.state.output_sids[uid]] = find_node(this.graph.nodes, parseInt(uid));
		
	this.first = 0;
	this.last = 0;
	this.step = 1;
	
	this.graph.registers.lock(this, 'index');
	var rdt = this.graph.registers.registers['index'].dt;
	
	if(rdt === this.core.datatypes.ANY)
		this.graph.registers.set_datatype('index', core.datatypes.FLOAT);
};
