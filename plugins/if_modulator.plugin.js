E2.p = E2.plugins["if_modulator"] = function(core, node)
{
	this.desc = 'Allows <b>value</b> though if <b>condition</b> is true and inhibits futher data-flow otherwise.';
	
	this.input_slots = [ 
		{ name: 'condition', dt: core.datatypes.BOOL, desc: 'Condition that, if true, allows <b>value</b> to be emitted.', def: 'False' },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be emitted if <b>condition</b> is true.', def: 0 } 
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits <b>value</b> if <b>condition</b> is true and nothing otherwise.' }
	];
};

E2.p.prototype.reset = function()
{
	this.condition = false;
	this.out_value = this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.condition = data;
	else
		this.value = data;
};	

E2.p.prototype.update_state = function()
{
	if(!this.condition)
		this.updated = false;
	else
		this.out_value = this.value;
};

E2.p.prototype.update_output = function(slot)
{
	return this.out_value;
};
