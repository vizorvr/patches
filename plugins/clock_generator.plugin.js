E2.plugins["clock_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits current absolute time in seconds.';
	this.input_slots = [];
	this.output_slots = [ { name: 'seconds', dt: core.datatypes.FLOAT } ];
	
	this.update_state = function(delta_t)
	{
		self.updated = true;
	};
	
	this.update_output = function(slot)
	{
		return core.abs_t;
	};
};
