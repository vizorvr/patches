E2.p = E2.plugins["convert_rgba_color_modulator"] = function(core, node)
{
	this.desc = 'Creates a new color from individual RGBA components.';
	
	this.input_slots = [
		 { name: 'red', dt: core.datatypes.FLOAT, desc: 'Red channel value.', lo: 0, hi: 1, def: 1.0 },
		 { name: 'green', dt: core.datatypes.FLOAT, desc: 'Green channel value.', lo: 0, hi: 1, def: 1.0 },
		 { name: 'blue', dt: core.datatypes.FLOAT, desc: 'Blue channel value.', lo: 0, hi: 1, def: 1.0 },
		 { name: 'alpha', dt: core.datatypes.FLOAT, desc: 'Alpha channel value.', lo: 0, hi: 1, def: 1.0 }
	];
	
	this.output_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The output color', def: core.renderer.color_white } 
	];
};

E2.p.prototype.reset = function()
{
	this.color = new Color(1.0, 1.0, 1.0, 1.0);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.color.rgba[slot.index] = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
};

E2.p.prototype.update_output = function(slot)
{
	return this.color;
};
