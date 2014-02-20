E2.p = E2.plugins["parse_json_modulator"] = function(core, node)
{
	this.desc = 'Emits an object representation of the supplied JSON string.';
	
	this.input_slots = [
		{ name: 'json', dt: core.datatypes.TEXT, desc: 'Input string to be parsed.' }
	];
	
	this.output_slots = [
		{ name: 'object', dt: core.datatypes.OBJECT, desc: 'The object representation of the supplied json.', def: 'Empty object' }
	];
};

E2.p.prototype.reset = function()
{
	this.obj = {};
};

E2.p.prototype.update_input = function(slot, data)
{
	try
	{
		this.obj = JSON.parse(data);
	}
	catch(e)
	{
		msg('ERROR: Failed to parse JSON: ' + e.message);
		this.obj = {};
	}
};	

E2.p.prototype.update_output = function(slot)
{
	return this.obj;
};
