E2.p = E2.plugins["sample_and_hold_modulator"] = function(core, node)
{
	this.desc = 'Emits the input value when \'sample\' is true and emits the last sampled value otherwise. Emits zero by default.';
	
	this.input_slots = 
	[ 
		{ name: 'sample', dt: core.datatypes.BOOL, desc: 'Sending true to this slot updated the output value to match the input value, false inhibits input sampling.', def: 'True' },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The input value.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The output value.', def: 0 }
	];
	
	this.state = { value: 0.0 };
};

E2.p.prototype.reset = function()
{
	this.has_updated = false;
	this.updated = true;
	this.last_state = true;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.sample = data;
	else
		this.buffer = data;
};

E2.p.prototype.update_state = function(delta_t)
{
	if(this.sample)
		this.state.value = this.buffer;
	else if(this.has_updated)
		this.updated = false;

	if(!this.sample && this.last_state)
	{
		this.last_state = this.sample;
		this.has_updated = false;
	}
};

E2.p.prototype.update_output = function(slot)
{
	this.has_updated = true;
	return this.state.value;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.state.value = 0.0;
		this.buffer = 0.0;
		this.sample = true;
	}
};
