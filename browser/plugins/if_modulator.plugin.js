E2.p = E2.plugins["if_modulator"] = function(core, node)
{
	this.desc = 'Allows <b>value</b> though if <b>condition</b> is true and inhibits futher data-flow otherwise.';
	
	this.input_slots = [ 
		{ name: 'condition', dt: core.datatypes.BOOL, desc: 'Condition that, if true, allows <b>value</b> to be emitted.', def: false },
		{ name: 'value', dt: core.datatypes.ANY, desc: 'Value to be emitted if <b>condition</b> is true.', def: null } 
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.ANY, desc: 'Emits <b>value</b> if <b>condition</b> is true and nothing otherwise.' }
	];

	this.lsg = new LinkedSlotGroup(core, node, [this.input_slots[1]], [this.output_slots[0]]);
	this.value = null;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(this.lsg.connection_changed(on, conn, slot))
		this.value = this.lsg.core.get_default_value(this.lsg.dt);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		this.condition = data;
		
		if(this.condition)
			delete this.input_slots[1].inactive;
		else
			this.input_slots[1].inactive = true;
	}
	else
		this.value = data;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.value = this.lsg.infer_dt();
};
