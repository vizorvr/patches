E2.plugins["toggle_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'For every continous sequence of \'true\' values sent to the \'trigger\' input slot the emitted value will switch from true to false and visa versa. The initial value is true.';
	this.input_slots = [ { name: 'trigger', dt: core.datatypes.BOOL, desc: 'Type: Bool<break>Every time true is sent one or more times in a row, the emitted value will switch between true and false, starting with true.' } ];
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL, desc: 'Type: Bool<break>The current state.' } ];
	this.state = { value: true };
	
	this.reset = function()
	{
		self.state.value = true;
		self.updated = true;
		self.triggered = false;
	};
	
	this.update_input = function(slot, data)
	{
		if(!self.triggered && data)
		{
			self.triggered = true;
			self.state.value = !self.state.value;
		}
		else if(!data)
			self.triggered = false;
	};	

	this.update_output = function(slot)
	{
		return self.state.value;
	};	
};
