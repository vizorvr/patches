E2.p = E2.plugins["light_intensity_modulator"] = function(core, node)
{
	this.desc = 'Sets the intensity of the light source to a given factor.';
	
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.', def: core.renderer.light_default },
		{ name: 'intensity', dt: core.datatypes.FLOAT, desc: 'The light intensity.', def: 1.0, lo: 0 } 
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
		this.intensity = data < 0.0 ? 0.0 : data;
};

E2.p.prototype.update_state = function()
{
	this.light.intensity = this.intensity;
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
		this.intensity = 1.0;
	}
};
