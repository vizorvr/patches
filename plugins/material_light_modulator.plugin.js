E2.p = E2.plugins["material_light_modulator"] = function(core, node)
{
	this.desc = 'Sets the light parameters for a lightsource speficied by index.';
	
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'light index', dt: core.datatypes.FLOAT, desc: 'The index of the light in the supplied <b>material</b>.', def: 0, lo: 0, hi: 9 },
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'The light to use in the specified <b>index</b> of the supplied <b>material</b>.', def: 0, lo: 0, hi: 7 },
	];
	
	this.output_slots = [
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.material = data;
	else if(slot.index === 1)
		this.next_index = data < 0 ? 0 : data > 7 ? 7 : data;
	else if(slot.index === 2)
		this.light = data;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
	{
		if(slot.index === 0)
			this.material = new Material();
		else if(slot.index === 2)
			this.light = null;
	}
};

E2.p.prototype.update_state = function()
{
	this.material.lights[this.index] = null;
	this.material.lights[this.next_index] = this.light;
	this.index = this.next_index;
};

E2.p.prototype.update_output = function(slot)
{
	return this.material;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.material = new Material();
		this.next_index = this.index = 0;
		this.light = null;
	}
};
