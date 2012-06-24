E2.plugins["transpose_matrix_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the transposed version of the supplied matrix.';
	this.input_slots = [ { name: 'matrix', dt: core.datatypes.TRANSFORM } ];
	this.output_slots = [ { name: 'transposed', dt: core.datatypes.TRANSFORM } ];

	this.reset = function()
	{
		self.matrix = mat4.create();
		self.transposed = mat4.create();

		mat4.identity(self.matrix);
		mat4.identity(self.transposed);
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input)
		{
			mat4.identity(this.matrix);
			mat4.identity(this.transposed);
		}
	};	

	this.update_input = function(slot, data)
	{
		self.matrix = data;
	};	

	this.update_state = function(delta_t)
	{
		mat4.transpose(self.matrix, self.tranposed);
	};	

	this.update_output = function(slot)
	{
		return self.transposed;
	};
};
