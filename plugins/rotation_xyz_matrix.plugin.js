E2.plugins["rotation_xyz_matrix"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'x', dt: core.datatypes.FLOAT },
		{ name: 'y', dt: core.datatypes.FLOAT },
		{ name: 'z', dt: core.datatypes.FLOAT }
	];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.TRANSFORM } ];
	
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
