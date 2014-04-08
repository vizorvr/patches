E2.p = E2.plugins["convert_bool_float_modulator"] = function(core, node)
{
	this.desc = 'Convert a bool to a float. True emits 1 and false 0.';
	
	this.input_slots = [
		{ name: 'bool', dt: core.datatypes.BOOL, desc: 'Input boolean to be converted.', def: false } 
	];
	
	this.output_slots = [ 
		 { name: 'value', dt: core.datatypes.FLOAT, desc: 'Emits 0 when the input is false and 1 otherwise.', lo: 0.0, hi: 1.0, def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.value = data ? 1.0 : 0.0;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
