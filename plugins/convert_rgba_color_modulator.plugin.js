E2.plugins["convert_rgba_color_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Creates a new color from individual RGBA components.';
	this.input_slots = [
		 { name: 'red', dt: core.datatypes.FLOAT, desc: 'Red channel value.', lo: 0, hi: 1, def: 1 },
		 { name: 'green', dt: core.datatypes.FLOAT, desc: 'Green channel value.', lo: 0, hi: 1, def: 1 },
		 { name: 'blue', dt: core.datatypes.FLOAT, desc: 'Blue channel value.', lo: 0, hi: 1, def: 1 },
		 { name: 'alpha', dt: core.datatypes.FLOAT, desc: 'Alpha channel value.', lo: 0, hi: 1, def: 1 }
	];
	
	this.output_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The output color', def: 'White' } 
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
