E2.p = E2.plugins["log_modulator"] = function(core, node)
{
	this.desc = 'Log(x).';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'log(<b>value</b>).', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.value = Math.log(data);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
