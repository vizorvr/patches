E2.p = E2.plugins["transpose_matrix_modulator"] = function(core, node)
{
	this.desc = 'Emits the transposed version of the supplied <b>matrix</b>.';
	
	this.input_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The input matrix to be transposed.', def: core.renderer.matrix_identity }
	];
	
	this.output_slots = [
		{ name: 'transposed', dt: core.datatypes.MATRIX, desc: 'Emits the transposed input <b>matrix</b>.', def: core.renderer.matrix_identity }
	];
};

E2.p.prototype.reset = function()
{
	this.matrix = mat4.create();
	this.transposed = mat4.create();

	mat4.identity(this.matrix);
	mat4.identity(this.transposed);
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
	{
		mat4.identity(this.matrix);
		mat4.identity(this.transposed);
	}
};	

E2.p.prototype.update_input = function(slot, data)
{
	this.matrix = data;
};	

E2.p.prototype.update_state = function()
{
	mat4.transpose(this.matrix, this.transposed);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.transposed;
};
