E2.p = E2.plugins["multiply_modulator"] = function(core, node)
{
	this.desc = 'Multiplies the two supplied values and emits the result.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The first operand.', def: 0.0 },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The first operand.', def: 1.0 } 
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'The product of the two supplied values.', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.vals = [0.0, 1.0];
	this.output_val = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.vals[slot.index] = data;
};	

E2.p.prototype.update_state = function()
{
	this.output_val = this.vals[0] * this.vals[1];
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};
