E2.p = E2.plugins["random_float_generator"] = function(core, node)
{
	this.desc = 'Emits a random float constant in a specified range.';
	
	this.input_slots = [ 
		{ name: 'min', dt: core.datatypes.FLOAT, desc: 'Minimum output value.', def: 0 },
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'Maximum output value.', def: 1 } 
	];
	
	this.output_slots = [
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'Random output value between <b>min</b> and <b>max</b>.' }
	];
	
	this.lo = 0.0;
	this.hi = 1.0;
	this.value = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.lo = data;
	else if(slot.index === 1)
		this.hi = data;
};

E2.p.prototype.update_state = function()
{
	var l = this.lo;
	var h = this.hi;
	
	if(l > h)
	{
		var t = l;
		
		l = h;
		h = t;
	}
	
	this.value = l + (Math.random() * (h - l));
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	return this.value;
};
