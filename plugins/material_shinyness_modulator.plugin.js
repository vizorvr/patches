E2.p = E2.plugins["material_shinyness_modulator"] = function(core, node)
{
	this.desc = 'Set the specularity coefficient.';
	
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'shinyness', dt: core.datatypes.FLOAT, desc: 'Higher values indicates higher specularity.', def: 0, lo: 0, hi: 10 } 
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
		this.shinyness = data < 0.0 ? 0.0 : data > 10.0 ? 10.0 : data;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input && slot.index === 0)
		this.material = new Material();
};

E2.p.prototype.update_state = function(delta_t)
{
	this.material.shinyness = this.shinyness;
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
		this.shinyness = 1.0;
	}
};
