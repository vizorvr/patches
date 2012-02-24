E2.plugins["clock_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'seconds', dt: core.datatypes.FLOAT } ];
	
	this.update_output = function(index)
	{
		return core.abs_t;
	};
};
