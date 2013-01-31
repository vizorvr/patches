E2.p = E2.plugins["delegate_get_length_modulator"] = function(core, node)
{
	this.desc = 'Emits the number of elements in the supplied sequence <b>delegate</b>.';
	
	this.input_slots = [ 
		{ name: 'delegate', dt: core.datatypes.DELEGATE, desc: 'The delegate to the the number of elements in.', def: 0 }
	];
	
	this.output_slots = [
		{ name: 'count', dt: core.datatypes.FLOAT, desc: 'The number of elements in the supplied <b>delegate</b>.', def: 0 }
	];

	this.delegate = null;
	this.result = 0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.delegate = data;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.delegate ? this.delegate.count : 0;
};
