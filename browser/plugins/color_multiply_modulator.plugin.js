E2.p = E2.plugins["color_multiply_modulator"] = function(core, node)
{
	this.desc = 'Scale the RGB components of a color by a supplied factor.';
	
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Color to be modulated.', def: core.renderer.color_white },
		{ name: 'factor', dt: core.datatypes.FLOAT, desc: 'Factor to scale the RGB components of the supplied color with.', def: 1.0 } 
	];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Output color: R * V, G * V, B * V, A' }
	];
};

E2.p.prototype.reset = function()
{
	this.color = new Color(1, 1, 1);
	this.output_color = new Color(1, 1, 1);
	this.factor = 1.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.color = data;
	else
		this.factor = data;
};

E2.p.prototype.update_state = function()
{
	var rgba = this.color.rgba;
	var o_rgba = this.output_color.rgba;
	var f = this.factor;
	
	for(var i = 0; i < 3; i++)
	{
		var v = rgba[i] * f;
		
		o_rgba[i] = v < 0.0 ? 0.0 : v > 1.0 ? 1.0 : v;
	}
	
	o_rgba[3] = rgba[4];
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_color;
};
