g_Plugins["floor_modulator"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'value', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ { name: 'result', dt: core.datatypes.FLOAT } ];
	
	this.reset = function()
	{
		self.value = 0;
	};
	
	this.update_input = function(index, data)
	{
		if(index === 0)
			self.value = Math.floor(data);
	};	
	
	this.update_output = function(index)
	{
		return self.value;
	};	
};
