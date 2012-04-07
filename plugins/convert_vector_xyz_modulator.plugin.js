E2.plugins["convert_vector_xyz_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [
		{ name: 'vector', dt: core.datatypes.VERTEX } 
	];
	
	this.output_slots = [ 
		 { name: 'x', dt: core.datatypes.FLOAT },
		 { name: 'y', dt: core.datatypes.FLOAT },
		 { name: 'z', dt: core.datatypes.FLOAT }
	];
	
	this.reset = function()
	{
		self.value = [0.0, 0.0, 0.0];
	};
	
	this.update_input = function(slot, data)
	{
		self.value = data;
	};
	
	this.update_output = function(slot)
	{
		return self.value[slot.index];
	};
};
