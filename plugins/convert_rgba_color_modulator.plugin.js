E2.plugins["convert_rgba_color_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [
		 { name: 'red', dt: core.datatypes.FLOAT },
		 { name: 'green', dt: core.datatypes.FLOAT },
		 { name: 'blue', dt: core.datatypes.FLOAT },
		 { name: 'alpha', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR } 
	];
	
	this.reset = function()
	{
		self.color = new Color(1.0, 1.0, 1.0, 1.0);
	};
	
	this.update_input = function(slot, data)
	{
		self.color.rgba[slot.index] = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
	};
	
	this.update_output = function(slot)
	{
		return self.color;
	};
};
