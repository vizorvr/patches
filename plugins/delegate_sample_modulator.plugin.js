E2.p = E2.plugins["delegate_sample_modulator"] = function(core, node)
{
	this.desc = 'Sample the value of the supplied delegate given some parameter <b>x</b>.';
	
	this.input_slots = [ 
		{ name: 'delegate', dt: core.datatypes.DELEGATE, desc: 'The delegate to sample.', def: 'None' },
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'The parameter to evaluate the <b>delegate</b> for.', def: 0 } 
	];
	
	this.output_slots = [
		{ name: 'result', dt: core.datatypes.FLOAT, desc: 'The value the delegate evaluates for a given <b>x</b>.', def: 0 }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.delegate = data;
	else
		this.x = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	if(this.delegate)
		this.result = this.delegate.delegate(this.x);
};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.delegate = null;
		this.x = 0;
		this.result = 0;
	}
};
