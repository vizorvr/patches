E2.plugins["convert_bool_float_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Convert a bool to a float. True emits 1 and false 0.';
	this.input_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL } 
	];
	
	this.output_slots = [ 
		 { name: 'value', dt: core.datatypes.FLOAT }
	];
	
	this.reset = function()
	{
		self.value = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		self.value = data ? 1.0 : 0.0;
	};
	
	this.update_output = function(slot)
	{
		return self.value;
	};
};
