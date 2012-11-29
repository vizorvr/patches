E2.p = E2.plugins["subtract_modulator"] = function(core, node)
{
	this.desc = 'Subtract the second value from the first and emit the result.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The first operand.', def: 0 },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The second operand.', def: 0 } 
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'The result of <b>first</b> - <b>second</b>.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.input_val = 0.0;
	this.sub_val = 0.0;
	this.output_val = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.input_val = data;
	else
		this.sub_val = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	this.output_val = this.input_val - this.sub_val;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};
