E2.p = E2.plugins["convert_float_bool_modulator"] = function(core, node)
{
	this.desc = 'Convert a float to a boolean. 0 is false, everything else is true.';
	
	this.input_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Input float to be converted.', def: '0' } 
	];
	
	this.output_slots = [ 
		 { name: 'bool', dt: core.datatypes.BOOL, desc: 'Emits false when the input value is zero and true otherwise.', def: false }
	];
};

E2.p.prototype.reset = function()
{
	this.value = false;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.value = data === 0.0 ? false : true;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
