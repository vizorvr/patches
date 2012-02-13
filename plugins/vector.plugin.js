g_Plugins["vector"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT },
		{ name: 'y', dt: core.datatypes.FLOAT },
		{ name: 'z', dt: core.datatypes.FLOAT }
	];
	this.output_slots = [ { name: 'vector', dt: core.datatypes.VECTOR } ];
	
	this.reset = function()
	{
		self.xyz = [0.0, 0.0, 0.0];
	};
	
	this.update_input = function(index, data)
	{
		self.xyz[index] = data;
	};	

	this.update_output = function(index)
	{
		return self.xyz;
	};	
};
