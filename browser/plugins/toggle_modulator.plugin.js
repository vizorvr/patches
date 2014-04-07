E2.p = E2.plugins["toggle_modulator"] = function(core, node)
{
	this.desc = 'For every continous sequence of \'true\' values sent to the \'trigger\' input slot the emitted value will switch from true to false and visa versa. The initial value is true.';
	
	this.input_slots = [
		{ name: 'trigger', dt: core.datatypes.BOOL, desc: 'Every time true is sent one or more times in a row, the emitted value will switch between true and false, starting with true.', def: false }
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'The current state.', def: true }
	];
	
	this.state = { value: true };
};

E2.p.prototype.update_input = function(slot, data)
{
	if(data)
	{
		this.triggered = true;
		this.state.value = !this.state.value;
	}
};	

E2.p.prototype.update_state = function()
{
	if(!this.triggered)
		this.updated = false;
	
	this.triggered = false;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.state.value;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.state.value = true;
		this.triggered = true;
	}
};
