E2.p = E2.plugins["member_to_bool_modulator"] = function(core, node)
{
	this.desc = 'Emits a boolean representation of specified member of the supplied object.';
	
	this.input_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Input object.', def: null },
		{ name: 'member', dt: core.datatypes.TEXT, desc: 'Name of the member to be converted.', def: null }
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'The boolean representation of the specified member.', def: 'Empty array' }
	];
};

E2.p.prototype.reset = function()
{
	this.value = false;
	this.object = null;
	this.member = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.object = data;
	else if(slot.index === 1)
		this.member = data;
};	

E2.p.prototype.update_state = function()
{
	if(this.object === null || this.member === null)
		return;
	
	if(!this.object.hasOwnProperty(this.member))
	{
		msg('ERROR: Cannot convert unknown member "' + this.member + '".');
		return;
	}
	
	this.value = this.object[this.member] ? true: false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
