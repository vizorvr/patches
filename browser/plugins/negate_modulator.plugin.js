E2.p = E2.plugins["negate_modulator"] = function(core, node)
{
	this.desc = 'Emits the sign inverted input value.';
	
	this.input_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to be negated.', def: 0 }
	];
	
	this.output_slots = [
		{ name: '-value', dt: core.datatypes.FLOAT, desc: 'The sign-inverted input value.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.value = -data;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
