E2.p = E2.plugins["scale_matrix"] = function(core, node)
{
	this.desc = 'Create a matrix that scales by the supplied factors for each axis.';
	
	this.input_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Factors to scale each axis by.', def: [1, 1, 1] }
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX , desc: 'The resulting scale matrix.', def: core.renderer.matrix_identity }
	];
};

E2.p.prototype.reset = function()
{
	this.matrix = mat4.create();
	mat4.identity(this.matrix);
};

E2.p.prototype.update_input = function(slot, data)
{
	mat4.identity(this.matrix);
	mat4.scale(this.matrix, data);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};
