E2.plugins["color_multiply_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Scale the RGB components of a color by a supplied factor.';
	this.input_slots = [ 
		{ name: 'color', dt: core.datatypes.COLOR, desc: 'Type: Color<break>Color to be modulated.' },
		{ name: 'factor', dt: core.datatypes.FLOAT, desc: 'Factor to scale the RGB components of the supplied color with.' } 
	];
	
	this.output_slots = [ { name: 'color', dt: core.datatypes.COLOR } ];
	
	this.reset = function()
	{
		self.color = new Color(1, 1, 1);
		self.output_color = new Color(1, 1, 1);
		self.factor = 1.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.color = data;
		else
			self.factor = data;
	};
	
	this.update_state = function(delta_t)
	{
		var rgba = self.color.rgba;
		var o_rgba = self.output_color.rgba;
		var f = self.factor;
		
		for(var i = 0; i < 3; i++)
		{
			var v = rgba[i] * f;
			
			o_rgba[i] = v < 0.0 ? 0.0 : v > 1.0 ? 1.0 : v;
		}
		
		o_rgba[3] = rgba[4];
	};
	
	this.update_output = function(slot)
	{
		return self.output_color;
	};	
};
