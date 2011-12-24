g_Plugins["add_modulator"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT },
		{ name: 'value', dt: core.datatypes.FLOAT } 
	];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];
	this.state = null;
	this.input_val = 0.0;
	this.add_val = 1.0;
	this.output_val = 0.0;
	
	this.update_input = function(index, data)
	{
		if(index === 0)
			self.input_val = data;
		else
			self.add_val = data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = self.input_val + self.add_val;
	};
	
	this.update_output = function(index)
	{
		return self.output_val;
	};	
};
