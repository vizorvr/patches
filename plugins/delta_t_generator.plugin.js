g_Plugins["delta_t_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'seconds', dt: core.datatypes.FLOAT } ];
	this.state = { };
	
	this.update_output = function(index)
	{
		return core.delta_t;
	};
};
