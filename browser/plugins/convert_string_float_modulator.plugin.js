E2.p = E2.plugins["convert_string_float_modulator"] = function(core, node)
{
	this.desc = 'Convert a string to a float.';
	
	this.input_slots = [
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'Input string to be converted.', def: '0.0' } 
	];
	
	this.output_slots = [ 
		 { name: 'value', dt: core.datatypes.FLOAT, desc: 'The parsed float value of the input string or 0', def: 0 }
	];

	this.value = 0.0;
};

E2.p.prototype.reset = function()
{
	this.value = false;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.value = 0.0;

	try
	{
		this.value = parseFloat(data);
	}
	catch(e)
	{
	}
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
