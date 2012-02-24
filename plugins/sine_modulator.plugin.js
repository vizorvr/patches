E2.plugins["sine_modulator"] = function(core) {
	var self = this;
	
	this.input_slots = [ { name: 'time', dt: core.datatypes.FLOAT } ];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];

	this.reset = function()
	{
		self.time = 0.0;
		self.result = 0.0;
	};
	
	this.update_input = function(index, data)
	{
		self.time = data;
	};	

	this.update_state = function(delta_t)
	{
		self.result = Math.sin(self.time * 2.0 * Math.PI);
	};
	
	this.update_output = function(index)
	{
		return self.result;
	};	
};
