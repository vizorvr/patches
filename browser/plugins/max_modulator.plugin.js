E2.p = E2.plugins.max_modulator = function(core, node) {
	this.desc = 'Emit the greater of the two input values.';
	
	this.input_slots = [ 
		{ name: 'a', dt: core.datatypes.FLOAT, desc: 'The first input value', def: 0.0 },
		{ name: 'b', dt: core.datatypes.FLOAT, desc: 'The second input value', def: 0.0 } 
	];
	
	this.output_slots = [
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'The larger of the two supplied values.', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.val_a = 0.0;
	this.val_b = 0.0;
	this.output_val = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.val_a = data;
	else
		this.val_b = data;
};	

E2.p.prototype.update_state = function()
{
	this.output_val = Math.max(this.val_a, this.val_b);
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};	
