E2.plugins["graph"] = function(core, node) {
	var self = this;
	
	this.input_slots = [{ name: 'enabled', dt: core.datatypes.BOOL }];
	this.output_slots = [];
	this.state = { enabled: true };
	
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
	};
	
	this.update_state = function(delta_t)
	{
		if(self.graph && self.state.enabled)
			self.graph.update(delta_t); 
       	};
       	
       	this.graph_event = function(ev)
       	{
		msg('Graph listener: ' + ev.type + ': ' + ev.node.id);
		
		if(ev.type === 'node-created')
       		{
       			if(ev.node.id === 'input_proxy')
       			{
       			}
       			else if(ev.node.id === 'output_proxy')
       			{
       			}
       		}
       	};
};
