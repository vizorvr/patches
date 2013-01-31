E2.p = E2.plugins["clamped_accumulate_modulator"] = function(core, node)
{
	this.desc = 'Every input <b>value</b> is accumulated in an internal buffer. The buffer value is not permitted to be smaller then <b>min</b> or larger than <b>max</b>.';
	
	this.input_slots = 
	[
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'A small value to be accumulated in an internal buffer.', def: 0 },
		{ name: 'min', dt: core.datatypes.FLOAT, desc: 'Minimum internal buffer value.', def: 0 },
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'Maximum internal buffer value.', def: 1 },
		{ name: 'reset', dt: core.datatypes.FLOAT, desc: 'Send a value to this slot to reset the accumulator to that value.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The current value of the accumulation buffer.', def: 0 }
	];
	
	this.state = { value: 0.0 };
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		this.value = data;
		this.state.value += this.value;
		this.state.value = this.state.value < this.lo ? this.lo : this.state.value > this.hi ? this.hi : this.state.value;
	}
	if(slot.index === 1)
		this.lo = data;
	if(slot.index === 2)
		this.hi = data;
	if(slot.index === 3)
		this.state.value = data < this.lo ? this.lo : data > this.hi ? this.hi : data;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state.value;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.value = 0.0;
		this.lo = 0.0;
		this.hi = 1.0;
	}
};
