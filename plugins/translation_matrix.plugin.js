E2.plugins["translation_matrix"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a matrix that represent a translation.';
	this.input_slots = [ { name: 'vector', dt: core.datatypes.VECTOR, desc: 'Translation vector.', def: '0, 0, 0' } ];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting translation matrix.', def: 'Identity' } ];
	
	this.reset = function()
	{
		self.matrix = mat4.create();
	
		mat4.identity(self.matrix);
	};
	
	this.update_input = function(slot, data)
	{
		var m = self.matrix;
		
		m[12] = data[0];
		m[13] = data[1];
		m[14] = data[2];
	};	

	this.update_output = function(slot)
	{
		return self.matrix;
	};
};
