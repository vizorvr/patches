E2.p = E2.plugins["equals_modulator"] = function(core, node)
{
	this.desc = 'Emits true if <b>value</b> equals <b>reference</b> and false otherwise.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.ANY, desc: 'Input value.', def: null },
		{ name: 'reference', dt: core.datatypes.ANY, desc: 'Reference value to comprate <b>value</b> to.', def: null } 
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'True if <b>value</b> equals <b>reference</b> and false otherwise.', def: false }
	];

	this.lsg = new LinkedSlotGroup(core, node, [this.input_slots[0], this.input_slots[1]], []);
	this.value = null;
};

E2.p.prototype.reset = function()
{
	this.ref = null;
	this.state = false;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(this.lsg.connection_changed(on, conn, slot))
		this.value = this.ref = this.lsg.core.get_default_value(this.lsg.dt);
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
	this.state = (this.value === null || this.ref === null) ? false : this.value === this.ref;
};

E2.p.prototype.update_output = function(slot)
{
	return this.state;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.value = this.lsg.infer_dt();
};
