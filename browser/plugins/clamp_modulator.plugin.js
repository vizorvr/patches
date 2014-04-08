E2.p = E2.plugins["clamp_modulator"] = function(core, node)
{
	this.desc = 'Emit a float <b>value</b> no less than <b>min</b> and no greater than <b>max</b>.';
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Value to be clipped.', def: 0.0 },
		{ name: 'min', dt: core.datatypes.FLOAT, desc: 'Minimum output value.', def: 0.0 },
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'Maximum output value.', def: 1.0 } 
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'Emits <b>min</b> <= <b>value</b> >= <b>max</b>.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.input_val = 0.0;
	this.min_value = 0.0;
	this.max_value = 1.0;
	this.output_val = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.input_val = data;
	else if(slot.index === 1)
		this.min_value = data;
	else
		this.max_value = data;
};	

E2.p.prototype.update_state = function()
{
	var l = this.min_value,
	    h = this.max_value,
	    i = this.input_val;
	
	if(l > h)
	{
		var t = l;
		
		l = h;
		h = t;
	}
	
	this.output_val = i < l ? l : i > h ? h : i;
};

E2.p.prototype.update_output = function(slot)
{
	return this.output_val;
};
