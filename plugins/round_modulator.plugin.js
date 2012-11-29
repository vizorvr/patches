E2.p = E2.plugins["round_modulator"] = function(core, node)
{
	this.desc = 'Emits the input <b>value</b> rounded to the nearest integer.';
	
	this.input_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The input value to be rounded.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'The rounded integer.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.value = Math.round(data);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
