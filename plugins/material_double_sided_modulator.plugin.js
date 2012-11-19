E2.plugins["material_double_sided_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'If set to true, backface culling is disabled.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'double sided', dt: core.datatypes.BOOL, desc: 'Set to true to disable backface-culling.', def: 'False' } 
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else
			self.double_sided = data;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input && slot.index === 0)
			self.material = new Material();
	};

	this.update_state = function(delta_t)
	{
		self.material.double_sided = self.double_sided;
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
			self.double_sided = false;
		}
	};
};
