E2.p = E2.plugins["absolute_modulator"] = function(core, node)
{
	this.desc = 'Emit the absolute value of the input.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Positive or negative input value', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'Positive output value', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.input_val = 0.0;
	this.output_val = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.input_val = data;
};	

E2.p.prototype.update_state = function()
{
	this.output_val = Math.abs(this.input_val);
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};
