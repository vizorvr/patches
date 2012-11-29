E2.p = E2.plugins["rotation_matrix"] = function(core, node)
{
	this.desc = 'Create a matrix that performs a rotation around an arbitrary axis.';
	
	this.input_slots = [ 
		{ name: 'angle', dt: core.datatypes.FLOAT, desc: 'Number of degrees to rotate.', lo: -360, hi: 360, def: 0 },
		{ name: 'axis', dt: core.datatypes.VECTOR, desc: 'Normalized vector describing the axis around which the rotation is performed.', def: '0, 0, 1' }
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting rotation matrix.', def: 'Identity' }
	];
};

E2.p.prototype.reset = function()
{
	this.angle = 0.0;
	this.axis = [0.0, 0.0, 1.0];
	this.matrix = mat4.create();

	mat4.identity(this.matrix);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.angle = ((data % 360) / 180.0) * Math.PI;
	else
		this.axis = data;
};

E2.p.prototype.update_state = function()
{
	mat4.identity(this.matrix);
	mat4.rotate(this.matrix, this.angle, this.axis);
};

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};
