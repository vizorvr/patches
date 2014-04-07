E2.p = E2.plugins["string_concatenate_modulator"] = function(core, node)
{
	this.desc = 'Concatenates the two supplied strings.';
	
	this.input_slots = [ 
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The first string.', def: '' },
		{ name: 'text', dt: core.datatypes.TEXT, desc: 'The second string.', def: '' } 
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.TEXT, desc: 'The string representing the combination of <b>first</b> + <b>second</b>.' }
	];
};

E2.p.prototype.reset = function()
{
	this.text_a = '';
	this.text_b = '';
	this.output_val = '';
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.text_a = '' + data;
	else
		this.text_b = '' + data;
};	

E2.p.prototype.update_state = function()
{
	this.output_val = this.text_a + this.text_b;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};
