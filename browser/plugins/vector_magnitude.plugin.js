E2.p = E2.plugins["vector_magnitude"] = function(core, node)
{
	this.desc = 'Emits the magnitude (length) of the supplied vector.';
	
	this.input_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Input vector to compute the length of.', def: core.renderer.vector_origin }
	];
	
	this.output_slots = [
		{ name: 'mag', dt: core.datatypes.FLOAT, desc: 'Emits the magnitude of the input vector.', def: 0.0 }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector = data;
};	

E2.p.prototype.update_state = function()
{
	var x = this.vector.x,
		y = this.vector.y,
		z = this.vector.z;

	this.mag = Math.sqrt(x*x + y*y + z*z); 
};

E2.p.prototype.update_output = function(slot)
{
	return this.mag;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector = new THREE.Vector3(0, 0, 0)
		this.mag = 0.0;
	}
};
