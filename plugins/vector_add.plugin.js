E2.p = E2.plugins["vector_add"] = function(core, node)
{
	this.desc = 'Adds the X, Y and Z components of the supplied vectors and emits the result.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The first operand.', def: '0, 0, 0' }, 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The second operand.', def: '0, 0, 0' } 
	];
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits Fx + Sx, Fy + Sy, Fz + Sz.', def: '0, 0, 0' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector_a = data;
	else if(slot.index === 1)
		this.vector_b = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	var r = this.result, va = this.vector_a, vb = this.vector_b;
	
	r[0] = va[0] + vb[0];
	r[1] = va[1] + vb[1];
	r[2] = va[2] + vb[2];
};

E2.p.prototype.update_output = function(slot)
{
	return this.result;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector_a = [0, 0, 0];
		this.vector_b = [0, 0, 0];
		this.result = [0, 0, 0];
	}
};
