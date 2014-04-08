E2.p = E2.plugins["light_position_modulator"] = function(core, node)
{
	this.desc = 'Sets the position of the light source to a given vector.';
	
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.', def: core.renderer.light_default },
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'The light position.', def: [0, 1, 0] } 
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
		this.position = data;
};

E2.p.prototype.update_state = function()
{
	this.light.position = this.position;
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
		this.position = [0, 1, 0];
	}
};
