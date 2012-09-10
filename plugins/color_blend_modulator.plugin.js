E2.plugins["color_blend_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Color x-fader. Perform linear blend between two colors.';
	this.input_slots = [ 
		{ name: 'color A', dt: core.datatypes.COLOR, desc: 'First color operand.', def: 'Black' },
		{ name: 'color B', dt: core.datatypes.COLOR, desc: 'Second color operand.', def: 'Black' }, 
		{ name: 'mix', dt: core.datatypes.FLOAT, desc: '0: Emit pure color A\n1: Emit pure color B', lo: 0, hi: 1, def: 0.5 } 
	];
	this.output_slots = [ { name: 'color', dt: core.datatypes.COLOR, desc: 'Linear mix of color A and B:\n\nA * (1 - mix) + B * mix' } ];
	
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
		
		for(var i = 0; i < 4; i++)
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
			self.output_color = new Color(0, 0, 0);
			self.mix = 0.5;
		}
	};	
};
