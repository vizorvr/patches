E2.plugins["clamp_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit a float value no less than \'min\' and no greater than \'max\'.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>Value to be clipped.' },
		{ name: 'min', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>Minimum output value.' },
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>Maximum output value.' } 
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];

	this.reset = function()
	{
		self.input_val = 0.0;
		self.min_value = 0.0;
		self.max_value = 1.0;
		self.output_val = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.input_val = data;
		else if(slot.index === 1)
			self.min_value = data;
		else
			self.max_value = data;
	};	

	this.update_state = function(delta_t)
	{
		var l = self.min_value,
		    h = self.max_value,
		    i = self.input_val;
		
		if(l > h)
		{
			var t = l;
			
			l = h;
			h = t;
		}
		
		self.output_val = i < l ? l : i > h ? h : i;
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
