E2.p = E2.plugins["vector_scale"] = function(core, node)
{
	this.desc = 'Scale the X, Y and Z components of the supplied vector by the supplied factor.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The input vector to be scaled.', def: '0, 0, 0' }, 
		{ name: 'scale', dt: core.datatypes.FLOAT, desc: 'The scale factor.', def: 1.0 } 
	];
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits Vx * s, Vy *s, Vz * s.', def: '0, 0, 0' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector = data;
	else if(slot.index === 1)
		this.scale = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	var s = this.scale, sc = this.scaled, v = this.vector;
	
	sc[0] = v[0] * s;
	sc[1] = v[1] * s;
	sc[2] = v[2] * s;
};

E2.p.prototype.update_output = function(slot)
{
	return this.scaled;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector = [0, 0, 0];
		this.scaled = [0, 0, 0];
		this.scale = 1.0;
	}
};
