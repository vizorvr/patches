E2.p = E2.plugins["perspective_camera"] = function(core, node)
{
	this.desc = 'Create a new perspective (3D) camera.';
	
	this.input_slots = [
		{ name: 'FOV', dt: core.datatypes.FLOAT, desc: 'Field of view in degrees.', def: 45 },
		{ name: 'near', dt: core.datatypes.FLOAT, desc: 'Depth of the near clipping plane.', def: 1 },
		{ name: 'far', dt: core.datatypes.FLOAT, desc: 'Depth of the far clipping plane.', def: 1000 },
		{ name: 'position', dt: core.datatypes.VECTOR, desc: 'Camera position.', def: '0, 0, -1' },
		{ name: 'target', dt: core.datatypes.VECTOR, desc: 'Camera target.', def: '0, 0, 0' }
	];
	
	this.output_slots = [
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The resulting camera.' }
	];

	this.gl = core.renderer.context;
	this.canvas = core.renderer.canvas[0];
	this.up = [0.0, 1.0, 0.0];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.fov = data;
	else if(slot.index === 1)
		this.near = data;
	else if(slot.index === 2)
		this.far = data;
	else if(slot.index === 3)
		this.position = data;
	else
		this.target = data;
};

E2.p.prototype.update_state = function()
{
	var c = this.canvas;
	
	mat4.perspective(this.fov, c.width / c.height, this.near, this.far, this.camera.projection);
	mat4.lookAt(this.position, this.target, this.up, this.camera.view);
};

E2.p.prototype.update_output = function(slot)
{
	return this.camera;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.camera = new Camera(this.gl);
		this.fov = 45.0;
		this.near = 1.0;
		this.far = 1000.0;
		this.position = [0.0, 0.0, 1.0];
		this.target = [0.0, 0.0, 0.0];
	}
};
