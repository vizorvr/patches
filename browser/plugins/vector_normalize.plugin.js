E2.p = E2.plugins["vector_normalize"] = function(core, node)
{
	this.desc = 'Emit a normalized version of the supplied vector with a magnitude of 1.';
	
	this.input_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The input vector to be normalised.', def: core.renderer.vector_origin }
	];
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits the normalised input vector.', def: core.renderer.vector_origin }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector = data;
};	

E2.p.prototype.update_state = function()
{
	var x = this.vector.x, y = this.vector.y, z = this.vectory, sn = this.normalized;
	var len = Math.sqrt(x*x + y*y + z*z);

	if(!len) 
	{
		sn.x = 0;
		sn.y = 0;
		sn.z = 0;
	} 
	else if(len === 1) 
	{
		sn.x = x;
		sn.y = y;
		sn.z = z;
	}
	else
	{
		len = 1.0 / len;
	
		sn.x = x * len;
		sn.y = y * len;
		sn.z = z * len;
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
		this.vector = new THREE.Vector3(0, 0, 0)
		this.normalized = new THREE.Vector3(0, 0, 0)
	}
};
