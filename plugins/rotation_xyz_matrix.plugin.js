E2.plugins["rotation_xyz_matrix"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a matrix that rotates individually around the X, Y and Z axis.';
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT, desc: 'Number of degrees to rotate around the X-axis.', lo: -360, hi: 360, def: 0 },
		{ name: 'y', dt: core.datatypes.FLOAT, desc: 'Number of degrees to rotate around the Y-axis.', lo: -360, hi: 360, def: 0 },
		{ name: 'z', dt: core.datatypes.FLOAT, desc: 'Number of degrees to rotate around the Z-axis.', lo: -360, hi: 360, def: 0 }
	];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting rotation matrix.', def: 'Identity' } ];
	
	this.reset = function()
	{
		self.angles = [0.0, 0.0, 0.0];
		self.matrix = mat4.create();
	
		mat4.identity(self.matrix);
	};
	
	this.update_input = function(slot, data)
	{
		self.angles[slot.index] = ((data % 360) / 180.0) * Math.PI;
	};
	
	this.update_state = function()
	{
		mat4.identity(self.matrix);
		mat4.rotateX(self.matrix, self.angles[0]);
		mat4.rotateY(self.matrix, self.angles[1]);
		mat4.rotateZ(self.matrix, self.angles[2]);
	};

	this.update_output = function(slot)
	{
		return self.matrix;
	};	
};
