E2.plugins["scale_matrix"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a matrix that scales by the supplied factors for each axis.';
	this.input_slots = [ { name: 'vector', dt: core.datatypes.VERTEX } ];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.TRANSFORM } ];

	this.reset = function()
	{
		self.matrix = mat4.create();
		mat4.identity(self.matrix);
	};
	
	this.update_input = function(slot, data)
	{
		mat4.identity(self.matrix);
		mat4.scale(self.matrix, data);
	};	

	this.update_output = function(slot)
	{
		return self.matrix;
	};	
};
