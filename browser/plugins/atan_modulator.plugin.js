E2.p = E2.plugins["atan_modulator"] = function(core, node)
{
	this.desc = 'Atan(x).';
	
	this.input_slots = [ 
		{ name: 'x value', dt: core.datatypes.FLOAT, desc: 'X value.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'atan(<b>x</b>).', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
  this.value = Math.atan(data);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
