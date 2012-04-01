E2.plugins["color_blend_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'color A', dt: core.datatypes.COLOR },
		{ name: 'color B', dt: core.datatypes.COLOR }, 
		{ name: 'mix', dt: core.datatypes.FLOAT } 
	];
	
	this.output_slots = [ { name: 'color', dt: core.datatypes.COLOR } ];
	
	this.reset = function()
	{
		self.output_color = new Color(0, 0, 0);
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.color_a = data;
		else if(slot.index === 1)
			self.color_b = data;
		else
			self.mix = data;
	};	

	this.update_state = function(delta_t)
	{
		var mix = self.mix;
		var inv_mix = 1.0 - mix;
		var ca = self.color_a.rgba;
		var cb = self.color_b.rgba;
		
		for(var i = 0; i < 3; i++)
			self.output_color.rgba[i] = (ca[i] * mix) + (cb[i] * inv_mix);
	};
	
	this.update_output = function(slot)
	{
		return self.output_color;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.color_a = new Color(0, 0, 0);
			self.color_b = new Color(0, 0, 0);
			self.mix = 0.0;
		}
	};	
};
