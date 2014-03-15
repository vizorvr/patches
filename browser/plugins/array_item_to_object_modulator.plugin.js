E2.p = E2.plugins["array_item_to_object_modulator"] = function(core, node)
{
	this.desc = 'Emits an object representation of the specified item in the named array member of the supplied object.';
	
	this.input_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Input object.' },
		{ name: 'member', dt: core.datatypes.TEXT, desc: 'Name of the array to be accessed.' },
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'Index of the array item to be converted.' }
	];
	
	this.output_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'The object representation of the specified array item.', def: 'Empty object' }
	];
};

E2.p.prototype.reset = function()
{
	this.value = {};
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
		msg('ERROR: Cannot convert unknown member "' + this.member + '".');
		return;
	}
	
	var a = this.object[this.member];
	
	if(Object.prototype.toString.call(a) !== '[object Array]')
	{
		msg('ERROR: Object member "' + this.member + '" is not an array.');
		return;
	}
	
	var d = a.length > 0 ? a[this.index % a.length] : null;
	
	if(d === null || typeof(d) !== 'object')
	{
		msg('ERROR: The member "' + this.member + '" is not an object.');
		return;
	}
	
	this.value = d;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
