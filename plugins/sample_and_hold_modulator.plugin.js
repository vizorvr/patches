E2.plugins["sample_and_hold_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the input value when \'sample\' is true and emits the last sampled value otherwise. Emits zero by default.';
	this.input_slots = 
	[ 
		{ name: 'sample', dt: core.datatypes.BOOL, desc: 'Sending true to this slot updated the output value to match the input value, false inhibits input sampling.', def: 'True' },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The input value.', def: 0 }
	];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT, desc: 'The output value.', def: 0 } ];
	this.state = { value: 0.0 };
	
	this.reset = function()
	{
		self.has_updated = false;
		self.updated = true;
		self.last_state = true;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.sample = data;
		else
			self.buffer = data;
	};
	
	this.update_state = function(delta_t)
	{
		if(self.sample)
			self.state.value = self.buffer;
		else if(self.has_updated)
			self.updated = false;
	
		if(!self.sample && self.last_state)
		{
			self.last_state = self.sample;
			self.has_updated = false;
		}
	};

	this.update_output = function(slot)
	{
		self.has_updated = true;
		return self.state.value;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.state.value = 0.0;
			self.buffer = 0.0;
			self.sample = true;
		}
	};
};
