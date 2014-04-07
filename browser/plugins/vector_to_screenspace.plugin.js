E2.p = E2.plugins["vector_to_screenspace"] = function(core, node)
{
	this.desc = 'Transform a vector from world to screenspace given a specified camera.';
	
	this.input_slots = [ 
		{ name: 'vector', dt: core.datatypes.VECTOR, desc: 'Input vector (in worldspace) to transform.', def: core.renderer.vector_origin },
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'Camera to use for transformation.', def: core.renderer.camera_screenspace } 
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
		this.camera = data;
};	

E2.p.prototype.update_state = function()
{
	var m = mat4.create();
	
	mat4.multiply(this.camera.projection, this.camera.view, m);
	mat4.multiplyVec3(m, this.vector, this.transformed);
};

E2.p.prototype.update_output = function(slot)
{
	return this.transformed;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.vector = [0, 0, 0];
		this.transformed = [0, 0, 0];
		this.camera = new Camera();
	}
};
