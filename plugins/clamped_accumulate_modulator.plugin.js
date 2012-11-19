E2.plugins["clamped_accumulate_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Every input <b>value</b> is accumulated in an internal buffer (which resets to zero on playback stop). The buffer value is not permitted to be smaller then <b>min</b> or larger than <b>max</b>.';
	this.input_slots = 
	[
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'A small value to be accumulated in an internal buffer.', def: 0 },
		{ name: 'min', dt: core.datatypes.FLOAT, desc: 'Minimum internal buffer value.', def: 0 },
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'Maximum internal buffer value.', def: 1 }
	];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'The current value of the accumulation buffer.', def: 0 } ];
	this.state = { value: 0.0 };
	
	this.reset = function()
	{
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

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.value = 0.0;
			self.lo = 0.0;
			self.hi = 1.0;
		}
	};
};
