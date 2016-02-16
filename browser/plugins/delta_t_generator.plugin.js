E2.p = E2.plugins["delta_t_generator"] = function(core, node)
{
	this.desc = 'Emits the current frame delta time in seconds.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'seconds', dt: core.datatypes.FLOAT, desc: 'Last frame delta time in seconds.' }
	];
	
	this.core = core;
};

E2.p.prototype.update_state = function(updateContext)
{
	this.delta_t = updateContext.delta_t
	// Ensure that we continously update
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	return this.delta_t;
};
