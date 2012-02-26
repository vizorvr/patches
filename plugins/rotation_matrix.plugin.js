E2.plugins["rotation_matrix"] = function(core, node) {
	var self = this;
	
	this.input_slots = [ 
		{ name: 'angle', dt: core.datatypes.FLOAT },
		{ name: 'axis', dt: core.datatypes.VECTOR }
	];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.MATRIX } ];

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
			self.angle = data;
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
