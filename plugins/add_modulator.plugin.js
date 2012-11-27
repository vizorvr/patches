E2.p = E2.plugins["add_modulator"] = function(core, node)
{
	this.desc = 'Add two floating point values.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The first operand.', def: 0 },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The second operand.', def: 0 } 
	];
	
	this.output_slots = [ 
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'The result of <b>first</b> + <b>second</b>.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.input_val = 0.0;
	this.add_val = 0.0;
	this.output_val = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.input_val = data;
	else
		this.add_val = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	this.output_val = this.input_val + this.add_val;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};

