E2.p = E2.plugins["delta_modulator"] = function(core, node)
{
	this.desc = 'Emits the derivative of the incoming <b>value</b>.';
	
	this.input_slots = 
	[ 
		{ name: 'reset', dt: core.datatypes.BOOL, desc: 'Send true to this slot to clear the internal state.', def: false },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'delta', dt: core.datatypes.FLOAT, desc: 'The delta value from the last frame update.', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.input_val = 0.0;
	this.last_val = 0.0;
	this.output_val = 0.0;
	this.clear = false;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.clear = data;
	else if(slot.index === 1)
		this.input_val = data;
};	

E2.p.prototype.update_state = function()
{
	if(this.clear)
	{
		this.output_val = 0.0;
		this.clear = false;
	}
	else
		this.output_val = this.input_val - this.last_val;

	this.last_val = this.input_val;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};
