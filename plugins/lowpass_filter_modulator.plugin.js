E2.plugins["lowpass_filter_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT },
		{ name: 'amount', dt: core.datatypes.FLOAT } 
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];

	this.reset = function()
	{
		self.input_val = 0.0;
		self.amount = 0.9;
		self.output_val = 0.0;
		self.last_val = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.input_val = data;
		else
			self.amount = data < 0.0 ? 0.0 : data > 0.999 ? 0.999 : data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = (self.input_val * (1.0 - self.amount)) + (self.last_val * self.amount);
		self.last_val = self.output_val; 
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
