E2.plugins["delta_t_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'seconds', dt: core.datatypes.FLOAT } ];
	
	this.update_output = function(index)
	{
		return core.delta_t;
	};
};
