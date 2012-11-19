E2.plugins["light_position_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Sets the position of the light source to a given vector.';
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.' },
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'The light position.', def: '0, 1, 0' } 
	];
	
	this.output_slots = [ { name: 'light', dt: core.datatypes.LIGHT, desc: 'The modified light.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.light = data;
		else
			self.position = data;
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input && slot.index === 0)
			self.light = new Light();
	};

	this.update_state = function(delta_t)
	{
		self.light.position = self.position;
	};
	
	this.update_output = function(slot)
	{
		return self.light;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.light = new Light();
			self.position = [0, 1, 0];
		}
	};
};
