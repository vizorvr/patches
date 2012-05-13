E2.plugins["invert_matrix_modulator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the inverse of the supplied matrix.';
	this.input_slots = [ { name: 'matrix', dt: core.datatypes.TRANSFORM } ];
	this.output_slots = [ { name: 'inverse', dt: core.datatypes.TRANSFORM } ];

	this.reset = function()
	{
		self.matrix = mat4.create();
		self.inverse = mat4.create();

		mat4.identity(self.matrix);
		mat4.identity(self.inverse);
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input)
		{
			mat4.identity(this.matrix);
			mat4.identity(this.inverse);
		}
	};	

	this.update_input = function(slot, data)
	{
		self.matrix = data;
	};	

	this.update_state = function(delta_t)
	{
		mat4.inverse(self.matrix, self.inverse);
	};	

	this.update_output = function(slot)
	{
		return self.inverse;
	};
};
