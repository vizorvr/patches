E2.p = E2.plugins["array_length_modulator"] = function(core, node)
{
	this.desc = 'Gets the length of an array (in bytes).';
	
	this.input_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The array to obtain the length of.' },
	];
	
	this.output_slots = [ 
		 { name: 'length', dt: core.datatypes.FLOAT, desc: 'The length (in bytes) of the supplied array.' }
	];

	this.node = node;
	this.reset();
};

E2.p.prototype.reset = function()
{
	this.array = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.array = data;
};

E2.p.prototype.update_output = function(slot)
{
	return this.array ? this.array.byteLength : 0;
};

E2.p.prototype.state_changed = function(ui)
{
};
