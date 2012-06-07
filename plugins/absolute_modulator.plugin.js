E2.plugins["absolute_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit the absolute value of the input.';
	this.input_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];
	
	this.reset = function()
	{
		self.input_val = 0.0;
		self.output_val = 0.0;
	};
	
	this.update_input = function(slot, data)
	{
		self.input_val = data;
	};	

	this.update_state = function(delta_t)
	{
		self.output_val = Math.abs(self.input_val);
	};
	
	this.update_output = function(slot)
	{
		return self.output_val;
	};	
};
