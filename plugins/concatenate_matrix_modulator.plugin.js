g_Plugins["concatenate_matrix_modulator"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'matrix A', dt: core.datatypes.MATRIX },
		{ name: 'matrix B', dt: core.datatypes.MATRIX }
	];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.MATRIX } ];
	this.state = null;
	this.matrices = [mat4.create(), mat4.create()];
	this.matrix = mat4.create();
	
	mat4.identity(this.matrices[0]);
	mat4.identity(this.matrices[1]);
	mat4.identity(this.matrix);
	
	this.disconnect_input = function(index)
	{
		mat4.identity(this.matrices[index]);
	};	

	this.update_input = function(index, data)
	{
		self.matrices[index] = data;
	};	

	this.update_state = function(index, data)
	{
		mat4.multiply(self.matrices[0], self.matrices[1], self.matrix); // Output is the last parameter, bizarrely.
	};	

	this.update_output = function(index)
	{
		return self.matrix;
	};	
};
