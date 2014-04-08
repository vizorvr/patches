E2.p = E2.plugins["material_double_sided_modulator"] = function(core, node)
{
	this.desc = 'If set to true, backface culling is disabled.';
	
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.', def: core.renderer.material_default },
		{ name: 'double sided', dt: core.datatypes.BOOL, desc: 'Set to true to disable backface-culling.', def: false } 
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
		this.double_sided = data;
};

E2.p.prototype.update_state = function()
{
	this.material.double_sided = this.double_sided;
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
		this.double_sided = false;
	}
};
