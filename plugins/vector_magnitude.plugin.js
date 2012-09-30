E2.plugins["vector_magnitude"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the magnitude (length) of the supplied vector.';
	this.input_slots = [ { name: 'vector', dt: core.datatypes.VECTOR, desc: 'Input vector to compute the length of.', def: '0, 0, 0' } ];
	this.output_slots = [ { name: 'mag', dt: core.datatypes.FLOAT, desc: 'Emits the magnitude of the input vector.', def: 0 } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.vector = data;
	};	

	this.update_state = function(delta_t)
	{
		var x = self.vector[0], y = self.vector[1], z = self.vector[2];
	
		self.mag = Math.sqrt(x*x + y*y + z*z); 
	};
	
	this.update_output = function(slot)
	{
		return self.mag;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.vector = [0, 0, 0];
			self.mag = [0, 0, 0];
		}
	};
};
