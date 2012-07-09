E2.plugins["concatenate_matrix_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Combine two matrixes. Order is significant.';
	this.input_slots = [ 
		{ name: 'matrix A', dt: core.datatypes.TRANSFORM },
		{ name: 'matrix B', dt: core.datatypes.TRANSFORM }
	];
	this.output_slots = [ { name: 'matrix', dt: core.datatypes.TRANSFORM } ];

	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input)
			mat4.identity(this.matrices[slot.index]);
	};	

	this.update_input = function(slot, data)
	{
		self.matrices[slot.index] = data;
	};	

	this.update_state = function(delta_t)
	{
		var m = self.matrices;
		
		if(m[0] === null || m[1] === null)
			return;
		
		mat4.multiply(m[0], m[1], self.matrix);
	};	

	this.update_output = function(slot)
	{
		return self.matrix;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.matrices = [mat4.create(), mat4.create()];
			self.matrix = mat4.create();
	
			mat4.identity(self.matrices[0]);
			mat4.identity(self.matrices[1]);
			mat4.identity(self.matrix);
		}
	};
};
