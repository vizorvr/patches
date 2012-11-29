E2.p = E2.plugins["material_alpha_clip_modulator"] = function(core, node)
{
	this.desc = 'If set to true, fragments with alpha < 0.5 will be discarded.';
	
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'alpha clip', dt: core.datatypes.BOOL, desc: 'Set to true to discard fragments with alpha < 0.5.', def: 'False' } 
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
		this.alpha_clip = data;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input && slot.index === 0)
		this.material = new Material();
};

E2.p.prototype.update_state = function(delta_t)
{
	this.material.alpha_clip = this.alpha_clip;
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
		this.alpha_clip = false;
	}
};
