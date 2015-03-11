E2.p = E2.plugins["atan2_modulator"] = function(core, node)
{
	this.desc = 'Atan2(x, y).';
	
	this.input_slots = [ 
		{ name: 'x value', dt: core.datatypes.FLOAT, desc: 'X value.', def: 0.0 },
		{ name: 'y value', dt: core.datatypes.FLOAT, desc: 'Y value.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'atan(<b>x</b>,<b>y</b>).', def: 0.0 }
	];
};

E2.p.prototype.reset = function()
{
	this.x_value = 0.0;
	this.y_value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
  if (slot.index === 0)
	  this.x_value = data;
  else
    this.y_value = data;
};	

E2.p.prototype.update_output = function(slot)
{
  this.value = Math.atan2(this.x_value, this.y_value);

	return this.value;
};
