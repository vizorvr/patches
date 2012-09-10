E2.plugins["modulate_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Modulate <b>value</b> such that the result will always be never be negative and less than or equal to <b>limit</b>.';
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to be modulated.', def: 0 },
		{ name: 'limit', dt: core.datatypes.FLOAT, desc: 'Divisor.', lo: '>0', def: 1 } 
	];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT, desc: 'Emits the remainder of <b>value</b> divided by <b>limit</b>', def: 0 } ];

	this.reset = function()
	{
		self.input_val = 0.0;
		self.limit_val = 1.0;
		self.output_val = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.input_val = data;
		else
			self.limit_val = data == 0.0 ? 1.0 : data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = self.input_val % self.limit_val;
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
