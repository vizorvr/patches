E2.p = E2.plugins["ceiling_modulator"] = function(core, node)
{
	this.desc = 'Round <b>value</b> to the closest higher interger.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be rounded.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'The rounded result.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.value = Math.ceil(data);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
