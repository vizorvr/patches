E2.plugins["light_intensity_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Sets the intensity of the light source to a given factor.';
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.' },
		{ name: 'intensity', dt: core.datatypes.FLOAT, desc: 'The light intensity.', def: 1, lo: 0 } 
	];
	
	this.output_slots = [ { name: 'light', dt: core.datatypes.LIGHT, desc: 'The modified light.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.light = data;
		else
			self.intensity = data < 0.0 ? 0.0 : data;
	};
	
	this.update_state = function(delta_t)
	{
		self.light.intensity = self.intensity;
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
			self.intensity = 1.0;
		}
	};
};
