E2.p = E2.plugins["equals_modulator"] = function(core, node)
{
	this.desc = 'Emits true if <b>value</b> equals <b>reference</b> and false otherwise.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value.', def: 0 },
		{ name: 'reference', dt: core.datatypes.FLOAT, desc: 'Reference value to comprate <b>value</b> to.', def: 0 } 
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'True if <b>value</b> equals <b>reference</b> and false otherwise.', def: 'False' }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
	this.ref = 0.0;
	this.state = false;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.value = data;
	else
		this.ref = data;
};	

E2.p.prototype.update_state = function()
{
	this.state = this.value === this.ref;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state;
};
