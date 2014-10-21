E2.p = E2.plugins["object_stringify"] = function(core, node)
{
	this.desc = 'Serialize object to JSON (stringify)';
	
	this.input_slots = [ 
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'Object to serialize'},
	];
	
	this.output_slots = [
		{ name: 'json', dt: core.datatypes.TEXT, desc: 'The serialized object' }
	];
}

E2.p.prototype.reset = function()
{
	this._json = '';
}

E2.p.prototype.update_input = function(slot, data)
{
	switch(slot.index)
	{
		case 0:
			this._json = JSON.stringify(data);
			break;
	}
}

E2.p.prototype.update_output = function(slot)
{
	return this._json;
}
