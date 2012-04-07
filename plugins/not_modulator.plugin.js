E2.plugins["not_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ { name: 'bool', dt: core.datatypes.BOOL } ];
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL } ];
	
	this.reset = function()
	{
		self.input = false;
		self.output = true;
	};
	
	this.update_input = function(slot, data)
	{
		self.input = data;
	};	

	this.update_state = function(delta_t)
	{
		self.output = !self.input;
	};
	
	this.update_output = function(slot)
	{
		return self.output;
	};	
};
