E2.p = E2.plugins["exp_modulator"] = function(core, node)
{
	this.desc = 'Exp(x).';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'exp(<b>value</b>).', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.value = Math.exp(data);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
