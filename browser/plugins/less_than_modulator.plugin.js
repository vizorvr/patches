E2.p = E2.plugins["less_than_modulator"] = function(core, node)
{
	this.desc = 'Emits true if the supplied <b>value</b> is less than <b>reference</b> and false otherwise.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input value to compare.', def: 0.0 },
		{ name: 'reference', dt: core.datatypes.FLOAT, desc: 'Reference to compare <b>value</b> to.', def: 0.0 } 
	];
	
	this.output_slots = [ { name: 'bool', dt: core.datatypes.BOOL, desc: 'Emits true if <b>value</b> is less than <b>reference</b> and false otherwise.', def: false } ];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
	this.ref = 0.0;
	this.state = null;
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
	var nst = this.value < this.ref;
	
	if(nst !== this.state)
		this.state = nst;
	else
		this.updated = false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state;
};
