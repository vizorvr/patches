E2.plugins["accumulate_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Every input value is accumulated in an internal buffer (which resets to zero on playback stop).';
	this.input_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>A small value to be accumulated in an internal buffer.' } ];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>The current value of the accumulation buffer.' } ];
	this.state = { value: 0.0 };
	
	this.reset = function()
	{
		self.state.value = 0.0;
		self.updated = true;
	};
	
	this.update_input = function(slot, data)
	{
		self.state.value += data;
	};	

	this.update_output = function(slot)
	{
		return self.state.value;
	};	
};
