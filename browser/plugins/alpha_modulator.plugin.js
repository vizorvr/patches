E2.p = E2.plugins["alpha_modulator"] = function(core, node)
{
	this.desc = 'Changes the alpha component of the supplied <b>color</b> to the supplied <b>alpha</b>.';
	
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Input color with any alpha value', def: core.renderer.color_white },
		{ name: 'alpha', dt: core.datatypes.FLOAT, desc: 'Replacement alpha value', lo: 0, hi: 1, def: 1.0 } 
	];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Emits the input <b>color</b> with the A-channel replaced by <b>alpha</b>.' }
	];
};

E2.p.prototype.reset = function()
{
	this.color = new Color(1, 1, 1);
};

E2.p.prototype.update_input = function(slot, data)
{
	var rgba = this.color.rgba;
	
	if(slot.index === 0)
	{
		rgba[0] = data.rgba[0];
		rgba[1] = data.rgba[1];
		rgba[2] = data.rgba[2];
	
	}
	else
		rgba[3] = data;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.color;
};

