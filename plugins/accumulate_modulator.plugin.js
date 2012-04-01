E2.plugins["accumulate_modulator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.state = { value: 0.0 };
	
	this.reset = function()
	{
		self.state.value = 0.0;
		self.updated = true;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.state.value += data;
	};	

	this.update_output = function(slot)
	{
		return self.state.value;
	};	
};
