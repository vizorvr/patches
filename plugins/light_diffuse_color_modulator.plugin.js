E2.plugins["light_diffuse_color_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Sets the diffuse color of the light source.';
	this.input_slots = [ 
		{ name: 'light', dt: core.datatypes.LIGHT, desc: 'Input light.' },
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'The light diffuse color.', def: 'White' } 
	];
	
	this.output_slots = [ { name: 'light', dt: core.datatypes.LIGHT, desc: 'The modified light.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.light = data;
		else
			self.color = data;
	};
	
	this.update_state = function(delta_t)
	{
		self.light.diffuse_color = self.color;
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
			self.color = new Color(1, 1, 1, 1);
		}
	};
};
