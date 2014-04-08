E2.p = E2.plugins["member_array_length_modulator"] = function(core, node)
{
	this.desc = 'Emits the length of an array member of the supplied object.';
	
	this.input_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Input object containing an array.', def: null },
		{ name: 'member', dt: core.datatypes.TEXT, desc: 'Name of the array to emit the length of.', def: null }
	];
	
	this.output_slots = [
		{ name: 'length', dt: core.datatypes.FLOAT, desc: 'The length of the specified array or 0.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.len = 0;
	this.object = null;
	this.array_name = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.object = data;
	else if(slot.index === 1)
		this.array_name = data;
};	

E2.p.prototype.update_state = function()
{
	this.len = 0;
	
	if(this.object === null || this.array_name === null)
		return;
	
	if(!this.object.hasOwnProperty(this.array_name))
	{
		msg('ERROR: Cannot index unknown array "' + this.array_name + '".');
		return;
	}
	
	var a = this.object[this.array_name];
	
	if(Object.prototype.toString.call(a) !== '[object Array]')
	{
		msg('ERROR: Object member "' + this.array_name + '" is not an array.');
		return;
	}
	
	this.len = a.length;
};

E2.p.prototype.update_output = function(slot)
{
	return this.len;
};
