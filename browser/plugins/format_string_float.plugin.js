E2.p = E2.plugins["format_string_float"] = function(core, node)
{
	this.desc = 'Formats a float as a string.';
	
	this.input_slots = [
		{ name: 'float', dt: core.datatypes.FLOAT, desc: 'Input float to be formatted.', def: 0.0 },
		{ name: 'decimals', dt: core.datatypes.FLOAT, desc: 'Number of decimals to output.', def: 4 } 
	];
	
	this.output_slots = [ 
		 { name: 'text', dt: core.datatypes.TEXT, desc: 'The input float as a string.', def: '0.0' }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
	this.d_count = 4;
	this.result = '0.0';
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.value = data;
	else
		this.d_count = Math.round(data);
};

E2.p.prototype.update_state = function()
{
	this.result = this.value.toFixed(this.d_count);
};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};
