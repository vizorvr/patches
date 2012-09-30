E2.plugins["rotation_matrix"] = function(core, node) {
	var self = this;
	
	this.desc = 'Create a matrix that performs a rotation around an arbitrary axis.';
	this.input_slots = [ 
		{ name: 'angle', dt: core.datatypes.FLOAT, desc: 'Number of degrees to rotate.', lo: -360, hi: 360, def: 0 },
		{ name: 'axis', dt: core.datatypes.VECTOR, desc: 'Normalized vector describing the axis around which the rotation is performed.', def: '0, 0, 1' }
	];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The resulting rotation matrix.', def: 'Identity' } ];
	
	this.reset = function()
	{
		self.angle = 0.0;
		self.axis = [0.0, 0.0, 1.0];
		self.matrix = mat4.create();
	
		mat4.identity(self.matrix);
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.angle = ((data % 360) / 180.0) * Math.PI;
		else
			self.axis = data;
	};
	
	this.update_state = function()
	{
		mat4.identity(self.matrix);
		mat4.rotate(self.matrix, self.angle, self.axis);
	};

	this.update_output = function(slot)
	{
		return self.matrix;
	};	
};
