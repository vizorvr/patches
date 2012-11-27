E2.p = E2.plugins["color_blend_modulator"] = function(core, node)
{
	this.desc = 'Color x-fader. Perform linear blend between two colors.';
	
	this.input_slots = [ 
		{ name: 'color A', dt: core.datatypes.COLOR, desc: 'First color operand.', def: 'Black' },
		{ name: 'color B', dt: core.datatypes.COLOR, desc: 'Second color operand.', def: 'Black' }, 
		{ name: 'mix', dt: core.datatypes.FLOAT, desc: '0: Emit pure color A\n1: Emit pure color B', lo: 0, hi: 1, def: 0.5 } 
	];
	
	this.output_slots = [
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Linear mix of color A and B:\n\nA * (1 - mix) + B * mix' }
	];
};

E2.p.prototype.reset = function()
{
	this.output_color = new Color(0, 0, 0);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.color_a = data;
	else if(slot.index === 1)
		this.color_b = data;
	else
		this.mix = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	var mix = this.mix;
	var inv_mix = 1.0 - mix;
	var ca = this.color_a.rgba;
	var cb = this.color_b.rgba;
	var oc = this.output_color.rgba;
	
	for(var i = 0; i < 4; i++)
		oc[i] = (ca[i] * mix) + (cb[i] * inv_mix);
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_color;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.color_a = new Color(0, 0, 0);
		this.color_b = new Color(0, 0, 0);
		this.output_color = new Color(0, 0, 0);
		this.mix = 0.5;
	}
};
