E2.plugins["convert_oscilator_unit_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [
		{ name: '[-1;1]', dt: core.datatypes.FLOAT } 
	];
	
	this.output_slots = [ 
		 { name: '[0;1]', dt: core.datatypes.FLOAT }
	];
	
	this.reset = function()
	{
		self.value = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		var v = (data + 1.0) * 0.5;
		
		self.value = v < 0.0 ? 0.0 : v > 1.0 ? 1.0 : v;
	};
	
	this.update_output = function(slot)
	{
		return self.value;
	};
};
