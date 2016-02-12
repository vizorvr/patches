E2.p = E2.plugins["clock_generator"] = function(core, node)
{
	this.desc = 'Emits current absolute time in seconds.';
	
	this.input_slots = [];
	
	this.output_slots = [ 
		{ name: 'seconds', dt: core.datatypes.FLOAT, desc: 'Current absolute time.' }
	];
	
	this.core = core;
};

E2.p.prototype.update_state = function(updateContext)
{
	this.abs_t = updateContext.abs_t
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	return this.abs_t;
};
