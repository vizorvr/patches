E2.plugins["vector_normalize"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit a normalized version of the supplied vector with a magnitude of 1.';
	this.input_slots = [ { name: 'vector', dt: core.datatypes.VERTEX, desc: 'The input vector to be normalised.', def: '0, 0, 0' } ];
	this.output_slots = [ { name: 'vector', dt: core.datatypes.VERTEX, desc: 'Emits the normalised input vector.', def: '0, 0, 0' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.vector = data;
	};	

	this.update_state = function(delta_t)
	{
		var x = self.vector[0], y = self.vector[1], z = self.vector[2];
		var len = Math.sqrt(x*x + y*y + z*z);
	
		if (!len) 
		{
			self.normalized[0] = 0;
			self.normalized[1] = 0;
			self.normalized[2] = 0;
		} 
		else if(len === 1) 
		{
			self.normalized[0] = x;
			self.normalized[1] = y;
			self.normalized[2] = z;
		}
	
		len = 1.0 / len;
		
		self.normalized[0] = x * len;
		self.normalized[1] = y * len;
		self.normalized[2] = z * len;
	};
	
	this.update_output = function(slot)
	{
		return self.normalized;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.vector = [0, 0, 0];
			self.normalized = [0, 0, 0];
		}
	};
};
