E2.plugins["material_ambient_color_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Set the ambient color.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The material ambient color.', def: '0.2, 0.2, 0.2' } 
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else
			self.color = data;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input && slot.index === 0)
			self.material = new Material();
	};

	this.update_state = function(delta_t)
	{
		self.material.ambient_color = self.color;
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
			self.color = new Color(0.2, 0.2, 0.2, 1);
		}
	};
};
