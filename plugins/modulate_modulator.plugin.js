g_Plugins["modulate_modulator"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT },
		{ name: 'limit', dt: core.datatypes.FLOAT } 
	];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];

	this.reset = function(ui)
	{
		self.input_val = 0.0;
		self.limit_val = 1.0;
		self.output_val = 0.0;
	};
	
	this.update_input = function(index, data)
	{
		if(index === 0)
			self.input_val = data;
		else
			self.limit_val = data == 0.0 ? 1.0 : data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = self.input_val % self.limit_val;
	};
	
	this.update_output = function(index)
	{
		return self.output_val;
	};	
};
