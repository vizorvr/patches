E2.plugins["convert_color_rgba_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Convert a color to its individual RGBA components so they can be individually manipulated.';
	this.input_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Input color to be split.', def: 'White' } 
	];
	
	this.output_slots = [ 
		 { name: 'red', dt: core.datatypes.FLOAT, desc: 'Red channel value.', def: 1 },
		 { name: 'green', dt: core.datatypes.FLOAT, desc: 'Green channel value.', def: 1 },
		 { name: 'blue', dt: core.datatypes.FLOAT, desc: 'Blue channel value.', def: 1 },
		 { name: 'alpha', dt: core.datatypes.FLOAT, desc: 'Alpha channel value.', def: 1 }
	];
	
	this.reset = function()
	{
		self.color = new Color(1.0, 1.0, 1.0, 1.0);
	};
	
	this.update_input = function(slot, data)
	{
		self.color = data;
	};
	
	this.update_output = function(slot)
	{
		return self.color.rgba[slot.index];
	};
};
