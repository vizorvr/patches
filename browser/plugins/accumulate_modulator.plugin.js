E2.p = E2.plugins["accumulate_modulator"] = function(core, node)
{
	this.desc = 'Every input <b>value</b> is accumulated in an internal buffer (which resets to zero on playback stop).';
	
	this.input_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'A small value to be accumulated in an internal buffer.', def: 0.0 },
		{ name: 'reset', dt: core.datatypes.FLOAT, desc: 'Send a value to this slot to reset the accumulator to that value.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The current value of the accumulation buffer.', def: 0.0 }
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
		this.state.value += data;
	else
		this.state.value = data;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.state.value;
};	

