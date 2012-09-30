E2.plugins["light_type_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Sets the type of the light source to either point or directional.';
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.' },
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'Set the light type. See also Generators/Values/Light type.', def: 'False' } 
	];
	
	this.output_slots = [ { name: 'light', dt: core.datatypes.LIGHT, desc: 'The modified light.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.light = data;
		else
			self.type = data < 0 ? 0 : data % Light.type.COUNT;
	};
	
	this.update_state = function(delta_t)
	{
		self.light.type = self.type;
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
			self.type = Light.type.POINT;
		}
	};
};
