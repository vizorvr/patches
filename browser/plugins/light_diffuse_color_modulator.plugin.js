E2.p = E2.plugins["light_diffuse_color_modulator"] = function(core, node)
{
	this.desc = 'Sets the diffuse color of the light source.';
	
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.', def: core.renderer.light_default },
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The light diffuse color.', def: core.renderer.color_white } 
	];
	
	this.output_slots = [
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'The modified light.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.light = data;
	else
		this.color = data;
};

E2.p.prototype.update_state = function()
{
	this.light.diffuse_color = this.color;
};

E2.p.prototype.update_output = function(slot)
{
	return this.light;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.light = new Light();
		this.color = vec4.createFrom(1, 1, 1, 1);
	}
};
