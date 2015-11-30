E2.p = E2.plugins["vector_transform"] = function(core, node)
{
	this.desc = 'Transform a vector by the supplied matrix.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Input vector to transform.' },
		{ name: 'matrix', dt: core.datatypes.MATRIX, desc: 'Transformation matrix to multiply the vector by.' }
	];
	
	this.output_slots = [
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Emits the transformed input vector.' }
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
	this.transformed.copy(this.vector)
	this.transformed.applyMatrix4(this.matrix)
};

E2.p.prototype.update_output = function(slot)
{
	return this.transformed;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector = new THREE.Vector3()
		this.transformed = new THREE.Vector3()
		this.matrix = new THREE.Matrix4()
		this.matrix.identity()
	}
};
