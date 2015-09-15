E2.p = E2.plugins["divide_modulator"] = function(core, node)
{
	this.desc = 'Divides <b>value</b> by <b>scalar</b> and emits the result.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to be divided.', def: 0.0 },
		{ name: 'scalar', dt: core.datatypes.FLOAT, desc: 'Factor to divide <b>value</b> by.', def: 1.0 } 
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'Emits <b>value</b> / <b>scalar</b>.', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
	this.scalar = 1.0;
	this.result = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.value = data;
	else
		this.scalar = data;
};	

E2.p.prototype.update_state = function()
{
	this.result = this.value / this.scalar;
};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};
