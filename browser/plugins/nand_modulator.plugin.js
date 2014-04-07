E2.p = E2.plugins["nand_modulator"] = function(core, node)
{
	this.desc = 'Emits false when both inputs are true and false otherwise.';
	this.input_slots = [ 
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'The first operand.', def: false },
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'The second operand.', def: false } 
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'Emits false if <b>first</b> and <b>second</b> are true and false otherwise.', def: false }
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

E2.p.prototype.update_state = function()
{
	this.state = !(this.conds[0] && this.conds[1]);
};

E2.p.prototype.update_output = function(slot)
{
	return this.state;
};
