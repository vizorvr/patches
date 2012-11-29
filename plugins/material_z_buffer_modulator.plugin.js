E2.p = E2.plugins["material_z_buffer_modulator"] = function(core, node)
{
	this.desc = 'En- or disables depth buffer test, and write.';
	
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'depth test', dt: core.datatypes.BOOL, desc: 'Set to true to discard behind the one already in the buffer.', def: 'True' },
		{ name: 'depth write', dt: core.datatypes.BOOL, desc: 'Set to false to stop writing fragment depth to the z-buffer.', def: 'True' },
		{ name: 'depth func', dt: core.datatypes.FLOAT, desc: 'Set z-buffer test function.', def: 'Less than or equal' }
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
		this.depth_test = data;
	else if(slot.index === 2)
		this.depth_write = data;
	else if(slot.index === 3)
		this.depth_func = data < 0 ? 0 : data % Material.depth_func.COUNT;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input && slot.index === 0)
		this.material = new Material();
};

E2.p.prototype.update_state = function(delta_t)
{
	this.material.depth_test = this.depth_test;
	this.material.depth_write = this.depth_write;
	this.material.depth_func = this.depth_func;
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
		this.depth_test = true;
		this.depth_write = true;
		this.depth_func = Material.depth_func.LEQUAL;
	}
};
