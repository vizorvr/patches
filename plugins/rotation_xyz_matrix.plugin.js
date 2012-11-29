E2.p = E2.plugins["rotation_xyz_matrix"] = function(core, node)
{
	this.desc = 'Create a matrix that rotates individually around the X, Y and Z axis.';
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'Number of degrees to rotate around the X-axis.', lo: -360, hi: 360, def: 0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'Number of degrees to rotate around the Y-axis.', lo: -360, hi: 360, def: 0 },
		{ name: 'z', dt: core.datatypes.FLOAT, desc: 'Number of degrees to rotate around the Z-axis.', lo: -360, hi: 360, def: 0 }
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting rotation matrix.', def: 'Identity' }
	];
};

E2.p.prototype.reset = function()
{
	this.angles = [0.0, 0.0, 0.0];
	this.matrix = mat4.create();

	mat4.identity(this.matrix);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.angles[slot.index] = ((data % 360) / 180.0) * Math.PI;
};

E2.p.prototype.update_state = function()
{
	mat4.identity(this.matrix);
	mat4.rotateX(this.matrix, this.angles[0]);
	mat4.rotateY(this.matrix, this.angles[1]);
	mat4.rotateZ(this.matrix, this.angles[2]);
};

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};
