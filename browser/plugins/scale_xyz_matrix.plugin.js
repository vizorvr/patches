E2.p = E2.plugins["scale_xyz_matrix"] = function(core, node)
{
	this.desc = 'Create a matrix that scales the X, Y and Z axis.';
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'Amount to scale the X-axis.', def: 1.0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'Amount to scale the Y-axis.', def: 1.0 },
		{ name: 'z', dt: core.datatypes.FLOAT, desc: 'Amount to scale the Z-axis.', def: 1.0 }
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting scale matrix.', def: core.renderer.matrix_identity }
	];
};

E2.p.prototype.reset = function()
{
	this.factors = vec3.createFrom(1.0, 1.0, 1.0);
	this.matrix = mat4.create();

	mat4.identity(this.matrix);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.factors[slot.index] = data;
};

E2.p.prototype.update_state = function()
{
	mat4.identity(this.matrix);
	mat4.scale(this.matrix, this.factors);
};

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};
