E2.p = E2.plugins["member_to_float_modulator"] = function(core, node)
{
	this.desc = 'Emits a float representation of specified member of the supplied object.';
	
	this.input_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Input object.' },
		{ name: 'member', dt: core.datatypes.TEXT, desc: 'Named of the member to be converted.' }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The float representation of the specified member.', def: 'Empty array' }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0;
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
	
	var d = this.object[this.member];
	
	if(isNaN(d))
	{
		msg('ERROR: The member "' + this.member + '" is not a float.');
		return;
	}
	
	this.value = d;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
