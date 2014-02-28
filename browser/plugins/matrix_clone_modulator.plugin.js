E2.p = E2.plugins["matrix_clone_modulator"] = function(core, node)
{
	this.desc = 'Makes a physical copy of the input matrix reference, to allow side-effect free transform chain branching.';
	
	this.input_slots = [ 
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'Input matrix reference.' }
	];
	
	this.output_slots = [
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'The cloned matrix.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	this.matrix = mat4.create(data);
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
		mat4.identity(this.matrix);
};

E2.p.prototype.update_output = function(slot)
{
	return this.matrix;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.matrix = mat4.create();
		
		mat4.identity(this.matrix);
	}
};
