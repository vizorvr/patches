E2.p = E2.plugins["material_diffuse_color_modulator"] = function(core, node)
{
	this.desc = 'Set the diffuse color.';
	
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The material diffuse color.', def: 'White' } 
	];
	
	this.output_slots = [
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.material = data;
	else
		this.color = data;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input && slot.index === 0)
		this.material = new Material();
};

E2.p.prototype.update_state = function(delta_t)
{
	this.material.diffuse_color = this.color;
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
		this.color = new Color(1, 1, 1, 1);
	}
};
