E2.p = E2.plugins["vector_normalize"] = function(core, node)
{
	this.desc = 'Emit a normalized version of the supplied vector with a magnitude of 1.';
	
	this.input_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The input vector to be normalised.', def: '0, 0, 0' }
	];
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits the normalised input vector.', def: '0, 0, 0' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	var x = this.vector[0], y = this.vector[1], z = this.vector[2], sn = this.normalized;
	var len = Math.sqrt(x*x + y*y + z*z);

	if(!len) 
	{
		sn[0] = 0;
		sn[1] = 0;
		sn[2] = 0;
	} 
	else if(len === 1) 
	{
		sn[0] = x;
		sn[1] = y;
		sn[2] = z;
	}
	else
	{
		len = 1.0 / len;
	
		sn[0] = x * len;
		sn[1] = y * len;
		sn[2] = z * len;
	}
};

E2.p.prototype.update_output = function(slot)
{
	return this.normalized;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector = [0, 0, 0];
		this.normalized = [0, 0, 0];
	}
};
