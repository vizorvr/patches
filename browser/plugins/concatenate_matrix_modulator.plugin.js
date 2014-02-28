E2.p = E2.plugins["concatenate_matrix_modulator"] = function(core, node)
{
	this.desc = 'Combine two matrices. Order is significant.';
	
	this.input_slots = [ 
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The first matrix operand.' },
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The second matrix operand.' }
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'Emits <b>first</b> * <b>second</b>.' }
	];
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
		mat4.identity(this.matrices[slot.index]);
};	

E2.p.prototype.update_input = function(slot, data)
{
	this.matrices[slot.index] = data;
};	

E2.p.prototype.update_state = function()
{
	var m = this.matrices;
	
	if(m[0] === null || m[1] === null)
		return;
	
	mat4.multiply(m[0], m[1], this.matrix);
};	

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.matrices = [mat4.create(), mat4.create()];
		this.matrix = mat4.create();

		mat4.identity(this.matrices[0]);
		mat4.identity(this.matrices[1]);
		mat4.identity(this.matrix);
	}
};

