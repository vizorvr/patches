E2.plugins["vector_scale"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VERTEX }, 
		{ name: 'scale', dt: core.datatypes.FLOAT } 
	];
	
	this.output_slots = [ { name: 'vector', dt: core.datatypes.VERTEX } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.vector = data;
		else if(slot.index === 1)
			self.scale = data;
	};	

	this.update_state = function(delta_t)
	{
		var s = self.scale;
		
		self.scaled[0] = self.vector[0] * s;
		self.scaled[1] = self.vector[1] * s;
		self.scaled[2] = self.vector[2] * s;
	};
	
	this.update_output = function(slot)
	{
		return self.scaled;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.vector = [0, 0, 0];
			self.scaled = [0, 0, 0];
			self.scale = 1.0;
		}
	};
};
