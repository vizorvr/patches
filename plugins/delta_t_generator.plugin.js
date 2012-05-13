E2.plugins["delta_t_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit the current frame delta time in fractional seconds.';
	this.input_slots = [];
	this.output_slots = [ { name: 'seconds', dt: core.datatypes.FLOAT } ];
	
	this.update_state = function(delta_t)
	{
		self.updated = true;
	};
	
	this.update_output = function(slot)
	{
		return core.delta_t;
	};
};
