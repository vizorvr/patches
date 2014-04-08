E2.p = E2.plugins["translation_matrix"] = function(core, node)
{
	this.desc = 'Create a matrix that represent a translation.';
	
	this.input_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Translation vector.', def: [0, 0, 0] }
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting translation matrix.', def: core.renderer.matrix_identity }
	];
};

E2.p.prototype.reset = function()
{
	this.matrix = mat4.create();
	mat4.identity(this.matrix);
};

E2.p.prototype.update_input = function(slot, data)
{
	var m = this.matrix;
	
	m[12] = data[0];
	m[13] = data[1];
	m[14] = data[2];
};	

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};
