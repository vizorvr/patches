E2.p = E2.plugins["delegate_loop_generator"] = function(core, node)
{
	this.desc = 'Emits a delegate that represents the list of indices in a sequence [<b>lo</b>...<b>hi</b>] in increments of <b>step</b>. These can be iterated over to form loops or to generate uniform integer sequences for other purposes.';
	
	this.input_slots = [
		{ name: 'lo', dt: core.datatypes.FLOAT, desc: 'The first index in the emitted sequence.', def: 0 },
		{ name: 'hi', dt: core.datatypes.FLOAT, desc: 'The last index in the emitted sequence.', def: 0 },
		{ name: 'step', dt: core.datatypes.FLOAT, desc: 'Granularity of the emitted sequence.', def: 1 }
	];
	
	this.output_slots = [ 
		{ name: 'delegate', dt: core.datatypes.DELEGATE, desc: 'The resulting sequence delegate.' } 
	];
	
	this.state = {};
	this.lo = 0;
	this.hi = 0;
	this.step = 1;
	this.delegate = new Delegate(this.delegate_func(this), 0, 0);
};

E2.p.prototype.delegate_func = function(self) { return function(x)
{
	var i = Math.floor(x) * self.step;
	
	return (i >= self.lo && i <= self.hi) ? i : 0;
}};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.lo = Math.floor(data);
	else if(slot.index === 1)
		this.hi = Math.floor(data);
	else
	{
		this.step = Math.floor(data);
		this.step = this.step === 0 ? 1 : this.step;
	}
};

E2.p.prototype.update_state = function(delta_t)
{
	if(this.lo > this.hi)
	{
		var t = this.lo;
		
		this.lo = this.hi;
		this.hi = this.t;
	}
	
	this.delegate.count = (this.hi - this.lo) / this.step;
};

E2.p.prototype.update_output = function(slot)
{
	return this.delegate;
};
