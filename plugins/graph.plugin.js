E2.plugins["graph"] = function(core, node) {
	var self = this;
	
	this.input_slots = [{ name: 'enabled', dt: core.datatypes.BOOL }];
	this.output_slots = [];
	this.state = { enabled: true, input_sids: {}, output_sids: {} };
	
	this.input_plgs = {};
	this.output_plgs = {};
	
	this.reset = function()
	{
		self.state.enabled = true;
		
		if(self.graph)
			self.graph.reset();
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.uid === undefined)
		{
			if(slot.index === 0)
				self.state.enabled = data;
		}
		else
		{
			self.input_plgs[slot.uid].input_updated(data);
		}
	};
	
	this.update_output = function(slot)
	{
		return self.output_plgs[slot.uid].data;
	};
	
	this.update_state = function(delta_t)
	{
		if(self.graph && self.state.enabled)
			self.graph.update(delta_t); 
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
       				self.input_plgs[sid] = ev.node.plugin;
       			}
       			else if(pid === 'output_proxy')
       			{
       				var sid = node.add_slot(E2.slot_type.output, { name: '' + ev.node.title, dt: core.datatypes.ANY });
       				
       				self.state.output_sids[ev.node.uid] = sid;
       				self.output_plgs[sid] = ev.node.plugin;
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
			return;

		var find_plugin = function(uid)
		{
			var nodes = self.graph.nodes;

			for(var i = 0, len = nodes.length; i < len; i++)
			{
				if(nodes[i].uid === uid)
					return nodes[i].plugin;
			}

			return null;
		};

		for(var uid in self.state.input_sids)
			self.input_plgs[self.state.input_sids[uid]] = find_plugin(parseInt(uid));

		for(var uid in self.state.output_sids)
			self.output_plgs[self.state.output_sids[uid]] = find_plugin(parseInt(uid));
	};
};
