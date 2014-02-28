E2.p = E2.plugins["light_direction_modulator"] = function(core, node)
{
	this.desc = 'Sets the direction normal of the light source to a given vector. The user is responsible for ensuring the normalization of the input vector.';
	
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.' },
		{ name: 'direction', dt: core.datatypes.VECTOR, desc: 'The light direction. Should be normalized.', def: '0, -1, 0' }
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
		this.direction = data;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input && slot.index === 0)
		this.light = new Light();
};

E2.p.prototype.update_state = function()
{
	this.light.direction = this.direction;
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
		this.direction = [0, -1, 0];
	}
};
