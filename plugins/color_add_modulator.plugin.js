E2.p = E2.plugins["color_add_modulator"] = function(core, node)
{
	this.desc = 'Adds a constant value to all components of a color. Each channel is clipped to the range 0;1.';
	
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Input color.' },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be added to the R, G and B channels.' } 
	];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Output color: R+V, G+V, B+V, A' }
	];
};

E2.p.prototype.reset = function()
{
	this.color = new Color(1, 1, 1);
	this.output_color = new Color(1, 1, 1);
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.color = data;
	else
		this.value = data;
};

E2.p.prototype.update_state = function()
{
	var rgba = this.color.rgba;
	var o_rgba = this.output_color.rgba;
	var val = this.value;
	
	for(var i = 0; i < 3; i++)
	{
		var v = rgba[i] + val;
		
		o_rgba[i] = v < 0.0 ? 0.0 : v > 1.0 ? 1.0 : v;
	}
	
	o_rgba[3] = rgba[4];
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_color;
};
