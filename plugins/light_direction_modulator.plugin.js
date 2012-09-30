E2.plugins["light_direction_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Sets the direction normal of the light source to a given vector. The user is responsible for ensuring the normalization of the input vector.';
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.' },
		{ name: 'direction', dt: core.datatypes.VERTEX, desc: 'The light direction. Should be normalized.', def: '0, -1, 0' }
	];
	
	this.output_slots = [ { name: 'light', dt: core.datatypes.LIGHT, desc: 'The modified light.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.light = data;
		else
			self.direction = data;
	};
	
	this.update_state = function(delta_t)
	{
		self.light.direction = self.direction;
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
			self.direction = [0, -1, 0];
		}
	};
};
