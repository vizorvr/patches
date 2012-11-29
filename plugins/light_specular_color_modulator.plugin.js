E2.p = E2.plugins["light_specular_color_modulator"] = function(core, node)
{
	this.desc = 'Sets the specular color of the light source.';
	
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.' },
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The light specular color.', def: 'White' } 
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

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input && slot.index === 0)
		this.light = new Light();
};

E2.p.prototype.update_state = function(delta_t)
{
	this.light.specular_color = this.color;
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
		this.color = new Color(1, 1, 1, 1);
	}
};
