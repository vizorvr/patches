E2.p = E2.plugins["and_modulator"] = function(core, node)
{
	this.desc = 'Emit true if and only if both inputs are true and false otherwise.';
	
	this.input_slots = [ 
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'The first operand.', def: 'False' },
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'The second operand.', def: 'False' } 
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'Emits true if <b>first</b> <i>and</i> <b>second</b> are true, and false otherwise.', def: 'False' }
	];
};

E2.p.prototype.reset = function()
{
	this.conds = [ false, false ];
	this.state = false;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.conds[slot.index] = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	this.state = this.conds[0] && this.conds[1];
};

E2.p.prototype.update_output = function(slot)
{
	return this.state;
};
