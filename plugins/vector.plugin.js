E2.plugins["vector"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT },
		{ name: 'y', dt: core.datatypes.FLOAT },
		{ name: 'z', dt: core.datatypes.FLOAT }
	];
	this.output_slots = [ { name: 'vector', dt: core.datatypes.VERTEX } ];
	
	this.update_input = function(slot, data)
	{
		self.xyz[slot.index] = data;
	};	

	this.update_output = function(slot)
	{
		return self.xyz;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.xyz = [0.0, 0.0, 0.0];
		}
	};	
};
