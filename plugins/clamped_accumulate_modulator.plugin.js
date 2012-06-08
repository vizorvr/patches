E2.plugins["clamped_accumulate_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Every input value is accumulated in an internal buffer (which resets to zero on playback stop). The buffer value is not permitted to be outside the range given by \'min\' and \'max\' (default 0 and 1)';
	this.input_slots = 
	[
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>A small value to be accumulated in an internal buffer.' },
		{ name: 'min', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>Minimum internal buffer value.' },
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>Maximum internal buffer value.' }
	];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'Type: Float<break>The current value of the accumulation buffer.' } ];
	this.state = { value: 0.0 };
	
	this.reset = function()
	{
		self.value = 0.0;
		self.lo = 0.0;
		self.hi = 1.0;
		self.updated = true;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
		{
			self.value = data;

			self.state.value += self.value;

			self.state.value = self.state.value < self.lo ? self.lo : self.state.value > self.hi ? self.hi : self.state.value;
		}
		if(slot.index === 1)
			self.lo = data;
		if(slot.index === 2)
			self.hi = data;
	};
	
	this.update_output = function(slot)
	{
		return self.state.value;
	};	
};
