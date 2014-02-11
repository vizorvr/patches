E2.p = E2.plugins["get_matrix_modulator"] = function(core, node)
{
	this.desc = 'Get matrix component.';
	
	this.input_slots = [ 
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'Matrix to get component of.' },
		{ name: 'row', dt: core.datatypes.FLOAT, desc: 'Row to get.', def: 0 },
		{ name: 'column', dt: core.datatypes.FLOAT, desc: 'Column to get.', def: 0 },
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The input matrix.' },
		{ name: 'value', dt: core.datatypes.FLOAT, desc: 'The value.', def: 0.0 }
	];
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
/*	if(!on && slot.type === E2.slot_type.input && slot.index === 0)
		mat4.identity(this.matrix);*/
};	

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.matrix = data;
	else if(slot.index === 1)
		this.row = data < 0 ? 0 : data > 3 ? 3 : data;
	else if(slot.index === 2)
		this.column = data < 0 ? 0 : data > 3 ? 3 : data;
};	

E2.p.prototype.update_state = function()
{
	this.value = this.matrix[(this.row * 4) + this.column];
};	

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this.matrix;
	
	return this.value;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.matrix = mat4.create();

		mat4.identity(this.matrix);
		this.row = 0;
		this.column = 0;
		this.value = 0.0;
	}
};
