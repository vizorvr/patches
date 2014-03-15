E2.p = E2.plugins["array_item_to_bool_modulator"] = function(core, node)
{
	this.desc = 'Emits a boolean representation of the specified item in the named array member of the supplied object.';
	
	this.input_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Input object.' },
		{ name: 'member', dt: core.datatypes.TEXT, desc: 'Name of the array to be accessed.' },
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'Index of the array item to be converted.' }
	];
	
	this.output_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'The boolean representation of the specified array item.', def: 'Empty array' }
	];
};

E2.p.prototype.reset = function()
{
	this.value = false;
	this.object = null;
	this.member = null;
	this.index = 0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.object = data;
	else if(slot.index === 1)
		this.member = data;
	else if(slot.index === 2)
	{
		this.index = Math.floor(data);
		this.index = this.index < 0 ? 0 : this.index;
	}
};	

E2.p.prototype.update_state = function()
{
	if(this.object === null || this.member === null)
		return;
	
	if(!this.object.hasOwnProperty(this.member))
	{
		msg('ERROR: Cannot index unknown array "' + this.member + '".');
		return;
	}
	
	var a = this.object[this.member];
	
	if(Object.prototype.toString.call(a) !== '[object Array]')
	{
		msg('ERROR: Object member "' + this.member + '" is not an array.');
		return;
	}
	
	this.value = a.length > 0 ? (a[this.index % a.length] ? true: false) : false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
