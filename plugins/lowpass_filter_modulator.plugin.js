g_Plugins["lowpass_filter_modulator"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT },
		{ name: 'amount', dt: core.datatypes.FLOAT } 
	];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];
	this.state = null;
	this.input_val = 0.0;
	this.amount = 0.9;
	this.output_val = 0.0;
	this.last_val = 0.0;
	
	this.create_ui = function()
	{
		return null;
	};
	
	this.update_input = function(index, data)
	{
		if(index === 0)
			self.input_val = data;
		else
			self.amount = data < 0.0 ? 0.0 : data > 0.999 ? 0.999 : data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = (self.input_val * (1.0 - self.amount)) + (self.last_val * self.amount);
		self.last_val = self.output_val; 
	};
	
	this.update_output = function(index)
	{
		return self.output_val;
	};	
};
