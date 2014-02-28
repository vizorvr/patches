E2.p = E2.plugins["not_modulator"] = function(core, node)
{
	this.desc = 'Emits true if the input is false and vice versa.';
	
	this.input_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'Input boolean to be inverted.', def: 'False' }
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'Truth-inverted input value.', def: 'True' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	this.input = data;
};	

E2.p.prototype.update_state = function()
{
	this.output = !this.input;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output;
};

E2.p.prototype.state_changed = function(ui)
{
	if(ui)
	{
		this.input = false;
		this.output = true;
	}
};
