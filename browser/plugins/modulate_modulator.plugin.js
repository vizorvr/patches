E2.p = E2.plugins["modulate_modulator"] = function(core, node)
{
	this.desc = 'Modulate <b>value</b> such that the result will always be never be negative and less than or equal to <b>limit</b>.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to be modulated.', def: 0.0 },
		{ name: 'limit', dt: core.datatypes.FLOAT, desc: 'Divisor.', lo: '>0', def: 1.0 } 
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'Emits the remainder of <b>value</b> divided by <b>limit</b>', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.input_val = 0.0;
	this.limit_val = 1.0;
	this.output_val = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.input_val = data;
	else
		this.limit_val = data == 0.0 ? 1.0 : data;
};	

E2.p.prototype.update_state = function()
{
	this.output_val = this.input_val % this.limit_val;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};
