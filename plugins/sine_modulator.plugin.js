g_Plugins["sine_modulator"] = function(core) {
	var self = this;
	
	this.input_slots = [ { name: 'time', dt: core.datatypes.FLOAT } ];
	this.output_slots = [ { name: 'value', dt: core.datatypes.FLOAT } ];
	this.state = { };
	this.time = 0.0;
	this.result = 0.0;
	
	this.create_ui = function()
	{
		return null;
	};
	
	this.update_input = function(index, data)
	{
		self.time = data;
	};	

	this.update_state = function(delta_t)
	{
		self.result = Math.sin(self.time * 2.0 * Math.PI);
	};
	
	this.update_output = function(index)
	{
		return self.result;
	};	
};
