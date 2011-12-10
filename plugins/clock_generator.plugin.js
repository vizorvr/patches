g_Plugins["clock_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'seconds', dt: core.datatypes.FLOAT } ];
	this.state = { };
	
	this.create_ui = function()
	{	
		return null;
	};
	
	this.update_state = function()
	{
	};
	
	this.update_output = function(index)
	{
		return core.abs_t;
	};
};
