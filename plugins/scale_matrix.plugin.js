E2.plugins["scale_matrix"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a matrix that scales by the supplied factors for each axis.';
	this.input_slots = [ { name: 'vector', dt: core.datatypes.VERTEX, desc: 'Factors to scale each axis by.', def: '1, 1, 1' } ];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.TRANSFORM , desc: 'The resulting scale matrix.', def: 'Identity' } ];

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
