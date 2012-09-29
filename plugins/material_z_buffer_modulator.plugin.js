E2.plugins["material_z_buffer_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'En- or disables depth buffer test, and write.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'depth test', dt: core.datatypes.BOOL, desc: 'Set to true to discard behind the one already in the buffer.', def: 'True' },
		{ name: 'depth write', dt: core.datatypes.BOOL, desc: 'Set to false to stop writing fragment depth to the z-buffer.', def: 'True' },
		{ name: 'depth func', dt: core.datatypes.FLOAT, desc: 'Set z-buffer test function.', def: 'Less than or equal' }
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else if(slot.index === 1)
			self.depth_test = data
		else if(slot.index === 2)
			self.depth_write = data
		else if(slot.index === 3)
			self.depth_func = data < 0 ? 0 : data % Material.depth_func.COUNT;
	};
	
	this.update_state = function(delta_t)
	{
		self.material.depth_test = self.depth_test;
		self.material.depth_write = self.depth_write;
		self.material.depth_func = self.depth_func;
	};
	
	this.update_output = function(slot)
	{
		return self.material;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.material = new Material();
			self.depth_test = true;
			self.depth_write = true;
			self.depth_func = Material.depth_func.LEQUAL;
		}
	};
};
