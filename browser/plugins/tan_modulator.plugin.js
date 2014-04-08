E2.p = E2.plugins["tan_modulator"] = function(core, node)
{
	this.desc = 'Tan(x).';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'tan(<b>value</b>).', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.value = Math.tan(data);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
