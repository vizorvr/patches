E2.p = E2.plugins["vector_add"] = function(core, node)
{
	this.desc = 'Adds the X, Y and Z components of the supplied vectors and emits the result.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The first operand.', def: core.renderer.vector_origin }, 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'The second operand.', def: core.renderer.vector_origin } 
	];
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits Fx + Sx, Fy + Sy, Fz + Sz.', def: core.renderer.vector_origin }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector_a = data;
	else if(slot.index === 1)
		this.vector_b = data;
};	

E2.p.prototype.update_state = function()
{
	var r = this.result, va = this.vector_a, vb = this.vector_b;
	r.set(va.x + vb.x, va.y + vb.y, va.z + vb.z)
};

E2.p.prototype.update_output = function()
{
	return this.result;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector_a = new THREE.Vector3(0, 0, 0)
		this.vector_b = new THREE.Vector3(0, 0, 0)
		this.result = new THREE.Vector3(0, 0, 0)
	}
};
