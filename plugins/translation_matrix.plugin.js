g_Plugins["translation_matrix"] = function(core) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR },
	];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.MATRIX } ];
	this.state = null;
	this.matrix = mat4.create();
	
	mat4.identity(this.matrix);
		
	this.update_input = function(index, data)
	{
		mat4.identity(self.matrix);
		mat4.translate(self.matrix, data);
	};	

	this.update_output = function(index)
	{
		return self.matrix;
	};	
};
