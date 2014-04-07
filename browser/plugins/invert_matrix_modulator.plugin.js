E2.p = E2.plugins["invert_matrix_modulator"] = function(core, node)
{
	this.desc = 'Emits the inverse of the supplied <b>matrix</b>.';
	
	this.input_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The input matrix to be inverted.', def: core.renderer.matrix_identity }
	];
	
	this.output_slots = [
		{ name: 'inverse', dt: core.datatypes.MATRIX, desc: 'Emits the inverse of the input <b>matrix</b>.', def: core.renderer.matrix_identity }
	];
};

E2.p.prototype.reset = function()
{
	this.matrix = mat4.create();
	this.inverse = mat4.create();

	mat4.identity(this.matrix);
	mat4.identity(this.inverse);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.matrix = data;
};	

E2.p.prototype.update_state = function()
{
	mat4.inverse(this.matrix, this.inverse);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.inverse;
};
