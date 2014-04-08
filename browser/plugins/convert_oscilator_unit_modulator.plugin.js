E2.p = E2.plugins["convert_oscilator_unit_modulator"] = function(core, node)
{
	this.desc = 'Rescales and offsets a number in the range -1;1 to the range 0;1.';
	
	this.input_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The input value.', lo: -1, hi: 1, def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The output value: (I + 1) / 2', lo: 0, hi: 1, def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	var v = (data + 1.0) * 0.5;
	
	this.value = v < 0.0 ? 0.0 : v > 1.0 ? 1.0 : v;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
