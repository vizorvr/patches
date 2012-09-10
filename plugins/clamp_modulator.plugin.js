E2.plugins["clamp_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit a float <b>value</b> no less than <b>min</b> and no greater than <b>max</b>.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be clipped.', def: 0 },
		{ name: 'min', dt: core.datatypes.FLOAT, desc: 'Minimum output value.', def: 0 },
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'Maximum output value.', def: 1 } 
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'Emits <b>min</b> <= <b>value</b> >= <b>max</b>.', def: 0 } ];

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
