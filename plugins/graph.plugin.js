E2.plugins["graph"] = function(core, node) {
	var self = this;
	
	this.input_slots = [{ name: 'enabled', dt: core.datatypes.BOOL }];
	this.output_slots = [];
	this.state = { enabled: true, input_sids: {}, output_sids: {} };
	
	this.input_nodes = {};
	this.output_nodes = {};
	this.is_reset = true;
	this.parent_node = node; // For reverse lookup in the core.
	
	this.reset = function()
	{
		self.state.enabled = true;
		
		if(self.graph)
			self.graph.reset();
	};
	
	this.get_dt_name = function(dt)
	{
		if(!dt || !dt.name)
			return 'ERROR';
			
		return dt.name;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(slot.uid !== undefined)
		{
			var psl = null;
				
			if(!on)
			{
				if(slot.type === E2.slot_type.input)
					psl = self.input_nodes[slot.uid].dyn_outputs[0];
				else if(slot.type === E2.slot_type.output)
				{
					var count = 0;
					
					for(var i = 0, len = node.outputs.length; i < len; i++)
					{
						if(node.outputs[i].src_slot === slot)
							count++;
					}
					
					if(count === 0)
						psl = self.output_nodes[slot.uid].dyn_inputs[0];
				}

				if(psl && !psl.connected)
				{
					psl.dt = slot.dt = core.datatypes.ANY;
					msg('Resetting PDT/GDT for slot(' + slot.uid + ')');
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
						msg('Setting GDT for slot(' + slot.uid + ') to ' + self.get_dt_name(conn.src_slot.dt));
					}
					
					tn = self.input_nodes[slot.uid];
					psl = tn.dyn_outputs[0];
				}
				else
				{
					if(slot.dt === core.datatypes.ANY)
					{
						slot.dt = conn.dst_slot.dt;
						msg('Setting GDT for slot(' + slot.uid + ') to ' + self.get_dt_name(conn.dst_slot.dt));
					}
					
					tn = self.output_nodes[slot.uid];
					psl = tn.dyn_inputs[0];
				}
				
				if(psl.dt === core.datatypes.ANY)
				{
					msg('Setting PDT for slot(' + psl.uid + ') to ' + self.get_dt_name(slot.dt));
					psl.dt = slot.dt;
					tn.plugin.data = core.get_default_value(slot.dt);
				}
			}
		}
	};
	
	this.proxy_connection_changed = function(on, p_node, t_node, slot, t_slot)
	{
		var find_sid = function(nodes, uid)
		{
			for(var n in nodes)
			{		
				if(nodes[n].uid === uid)
					return parseInt(n);
			}
			
			return -1;
		};
		
		var find_slot = function(slots, sid)
		{
			for(var i = 0, len = slots.length; i < len; i++)
			{
				var s = slots[i];
				
				if(s.uid === sid)
					return s;
			}
			
			return null;
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
			msg('Proxy slot change ' + on + ', last = ' + last + ', g_slot = ' + g_slot.uid + ', p_slot = ' + p_slot.uid);
			
			p_slot.connected = true;
			
			if(on)
			{
				if(p_slot.dt === core.datatypes.ANY)
				{
					p_slot.dt = t_slot.dt;		
					msg('    Setting PDT to ' + self.get_dt_name(t_slot.dt) + '.');
				
					if(g_slot.dt === core.datatypes.ANY)
					{
						p_node.plugin.data = core.get_default_value(t_slot.dt);
					}
				}

				if(g_slot.dt === core.datatypes.ANY)
				{
					g_slot.dt = t_slot.dt;		
					msg('    Setting GDT to ' + self.get_dt_name(t_slot.dt) + '.');
				}
			}
			else if(last)
			{
				var conns = node.parent_graph.connections;
				var connected = false;
				
				for(var i = 0, len = conns.length; i < len; i++)
				{
					var c = conns[i];
					
					if((g_slot.type === E2.slot_type.input && c.dst_slot === g_slot)
					|| (g_slot.type === E2.slot_type.output && c.src_slot === g_slot))
					{
						connected = true;
						break;
					}
				}
				
				p_slot.connected = false;

				if(!connected)
				{
					p_slot.dt = g_slot.dt = core.datatypes.ANY;
					msg('    Reverting to PDT/GDT to ANY.');
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
					
					var rgsl = find_slot(node.dyn_inputs, find_sid(self.input_nodes, t_node.uid));
					
					if(!connected && !is_gslot_connected(rgsl))
					{
						t_slot.dt = rgsl.dt = core.datatypes.ANY;
						msg('    Reverting remote proxy slot to PDT/GDT to ANY.');
					}
				}
				else if(t_node.plugin.id === 'output_proxy')
				{
					var rgsl = find_slot(node.dyn_outputs, find_sid(self.output_nodes, t_node.uid));
					
					if(!is_gslot_connected(rgsl))
					{
						t_slot.dt = rgsl.dt = core.datatypes.ANY;
						msg('    Reverting remote proxy slot to PDT/GDT to ANY.');
					}
				}
			}
		};
		
		if(p_node.plugin.id === 'input_proxy')
		{
			var last = p_node.outputs.length === 0;
			
			change_slots(last, find_slot(node.dyn_inputs, find_sid(self.input_nodes, p_node.uid)), slot);
			msg('    Output count = ' + p_node.outputs.length);
		}
		else
		{
			var last = p_node.inputs.length === 0;
			
			change_slots(last, find_slot(node.dyn_outputs, find_sid(self.output_nodes, p_node.uid)), slot);
			msg('    Input count = ' + p_node.inputs.length);
		}
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.uid === undefined)
		{
			if(slot.index === 0)
			{
				self.state.enabled = data;
			
				if(!data)
				{
					if(self.graph && !self.is_reset)
					{
						// self.graph.reset();
						self.is_reset = true;
						
						if(self.graph === E2.app.core.active_graph)
							E2.app.updateCanvas();
					}
				}
				else
					self.is_reset = false;
			}
		}
		else
		{
			self.input_nodes[slot.uid].plugin.input_updated(data);
		}
	};
	
	this.update_output = function(slot)
	{
		return self.output_nodes[slot.uid].plugin.data;
	};
	
	this.update_state = function(delta_t)
	{
		if(self.graph && self.state.enabled)
		{
			self.graph.update(delta_t);

       			for(var i = 0, len = node.outputs.length; i < len; i++)
       				node.outputs[i].cached_value = null;
       		}
       		else
       			self.updated = false;
       	};
       	
       	this.destroy_slot = function(type, sid)
       	{
       		var slots = (type === E2.slot_type.input) ? self.state.input_sids : self.state.output_sids;
       		
       		delete slots[sid];
       		node.remove_slot(type, sid);
       	};

       	this.graph_event = function(ev)
       	{
		var pid = ev.node.plugin.id;
		
		msg('Gevent type = ' + ev.type + ', node uid = ' + ev.node.uid);
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
       				self.destroy_slot(E2.slot_type.input, self.state.input_sids[ev.node.uid]);
       			else if(pid === 'output_proxy')
       				self.destroy_slot(E2.slot_type.output, self.state.output_sids[ev.node.uid]);
       		}
       		else if(ev.type === 'node-renamed')
       		{
       			if(pid === 'input_proxy')
       				node.rename_slot(E2.slot_type.input, self.state.input_sids[ev.node.uid], ev.node.title);
       			else if(pid === 'output_proxy')
       				node.rename_slot(E2.slot_type.output, self.state.output_sids[ev.node.uid], ev.node.title);
       		}
       	};

	this.state_changed = function(ui)
	{
		// Only rebuild the node lists during post-load patch up of the graph, 
		// during which 'ui' will be null. Otherwise the lists would have been rebuilt 
		// every time we switch to the graph containing this node in the editor.
		if(ui)
		{
			// Decorate the auto generated dom base element with an
			// additional class to allow custom styling.
			node.ui.dom.addClass('graph');
			return;
		}
		
		var find_node = function(uid)
		{
			var nodes = self.graph.nodes;

			for(var i = 0, len = nodes.length; i < len; i++)
			{
				if(nodes[i].uid === uid)
					return nodes[i];
			}

			return null;
		};

		for(var uid in self.state.input_sids)
			self.input_nodes[self.state.input_sids[uid]] = find_node(parseInt(uid));

		for(var uid in self.state.output_sids)
			self.output_nodes[self.state.output_sids[uid]] = find_node(parseInt(uid));
	};
};
