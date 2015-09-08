E2.p = E2.plugins["vector_transform"] = function(core, node)
{
	this.desc = 'Transform a vector by the supplied matrix.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Input vector to transform.', def: core.renderer.vector_origin },
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'Transformation matrix to multiply the vector by.', def: core.renderer.matrix_identity } 
	];
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits the transformed input vector.', def: core.renderer.vector_origin }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.vector = data;
	else if(slot.index === 1)
		this.matrix = data;
};	

E2.p.prototype.update_state = function()
{
	this.vector.transformDirection(this.matrix)
};

E2.p.prototype.update_output = function(slot)
{
	return this.transformed;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector = new THREE.Vector3(0, 0, 0)
		this.transformed = new THREE.Vector3(0, 0, 0)
		this.matrix = new THREE.Matrix4(0, 0, 0)
		this.matrix.identity()
	}
};
