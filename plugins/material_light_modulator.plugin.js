E2.plugins["material_light_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Sets the light parameters for a lightsource speficied by index.';
	this.input_slots = [ 
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'Input material.' },
		{ name: 'light index', dt: core.datatypes.FLOAT, desc: 'The index of the light in the supplied <b>material</b>.', def: 0, lo: 0, hi: 9 },
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'The light to use in the specified <b>index</b> of the supplied <b>material</b>.', def: 0, lo: 0 },
	];
	
	this.output_slots = [ { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The modified material.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.material = data;
		else if(slot.index === 1)
			self.next_index = data < 0 ? 0 : data > 9 ? 9 : data;
		else if(slot.index === 2)
			self.light = data;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input && slot.index === 2)
			self.light = null;
	};
	
	this.update_state = function(delta_t)
	{
		self.material.lights[self.index] = null;
		self.material.lights[self.next_index] = self.light;
		self.index = self.next_index;
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
			self.next_index = self.index = 0;
			self.light = null;
		}
	};
};
