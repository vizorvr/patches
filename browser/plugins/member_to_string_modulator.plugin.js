E2.p = E2.plugins["member_to_string_modulator"] = function(core, node)
{
	this.desc = 'Emits a string representation of specified member of the supplied object.';
	
	this.input_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Input object.' },
		{ name: 'member', dt: core.datatypes.TEXT, desc: 'Named of the member to be converted.' }
	];
	
	this.output_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The string representation of the specified member.', def: 'Empty array' }
	];
};

E2.p.prototype.reset = function()
{
	this.value = '';
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
	
	this.value = this.object[this.member].toString();
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
