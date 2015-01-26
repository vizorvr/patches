E2.p = E2.plugins["near_eq_modulator"] = function(core, node)
{
	this.desc = 'Emits true if the difference between <b>value</b> and <b>reference</b> is less than or equal to <b>proximity</b>.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to be compared.', def: 0.0 },
		{ name: 'proximity', dt: core.datatypes.FLOAT, desc: 'Proximity value for comparison.', def: 0.0 },
		{ name: 'reference', dt: core.datatypes.FLOAT, desc: 'Reference to compare <b>value</b> to.', def: 0.0 } 
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: this.desc, def: false }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
	this.proximity = 0.0;
	this.ref = 0.0;
	this.state = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.value = data;
	else if(slot.index === 1)
		this.proximity = data;
	else
		this.ref = data;
};	

E2.p.prototype.update_state = function()
{
	var nst = Math.abs(this.value - this.ref) <= this.proximity;
	
	if(nst !== this.state)
		this.state = nst;
	else
		this.updated = false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state;
};
