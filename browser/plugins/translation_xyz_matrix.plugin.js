E2.p = E2.plugins["translation_xyz_matrix"] = function(core, node)
{
	this.desc = 'Create a matrix that tranlates along the X, Y and Z axis.';
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'Amount to translate along the X-axis.', def: 0.0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'Amount to translate along the Y-axis.', def: 0.0 },
		{ name: 'z', dt: core.datatypes.FLOAT, desc: 'Amount to translate along the Z-axis.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting translation matrix.', def: core.renderer.matrix_identity }
	];
};

E2.p.prototype.reset = function()
{
	this.components = [0.0, 0.0, 0.0];
	this.matrix = mat4.create();

	mat4.identity(this.matrix);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.components[slot.index] = data;
};

E2.p.prototype.update_state = function()
{
	var m = this.matrix;

	mat4.identity(this.matrix);
	
	m[12] = this.components[0];
	m[13] = this.components[1];
	m[14] = this.components[2];
};

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};
