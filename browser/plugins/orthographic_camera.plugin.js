E2.p = E2.plugins["orthographic_camera"] = function(core, node)
{
	this.desc = 'Create a orthographic camera, i.e a 3d-camera with no perspectivation (isometric).';
	
	this.input_slots = [
		{ name: 'left', dt: core.datatypes.FLOAT, desc: 'Left plane x-coordinate.', def: -1.0 },
		{ name: 'right', dt: core.datatypes.FLOAT, desc: 'Right plane x-coordinate.', def: 1.0 },
		{ name: 'top', dt: core.datatypes.FLOAT, desc: 'Top plane y-coordinate.', def: -1.0 },
		{ name: 'bottom', dt: core.datatypes.FLOAT, desc: 'Bottom plane y-coordinate.', def: 1.0 },
		{ name: 'near', dt: core.datatypes.FLOAT, desc: 'Near plane z-coordinate.', def: 1.0 },
		{ name: 'far', dt: core.datatypes.FLOAT, desc: 'Far plane x-coordinate.', def: 1000.0 },
		{ name: 'transform', dt: core.datatypes.MATRIX, desc: 'Camera transform.', def: core.renderer.matrix_identity }
	];
	
	this.output_slots = [
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The resulting camera.' }
	];
	
	this.gl = core.renderer.context;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index < 6)
		this.params[slot.index] = data;
	else
		this.view = data;
};

E2.p.prototype.update_state = function()
{
	this.update_camera();
};

E2.p.prototype.update_camera = function()
{
	var p = this.params;
	
	this.camera = new Camera();
	mat4.ortho(p[0], p[1], p[2], p[3], p[4], p[5], this.camera.projection);
	this.camera.view = this.view;
};

E2.p.prototype.update_output = function(slot)
{
	return this.camera;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.camera = new Camera();
		this.params = [-1.0, 1.0, -1.0, 1.0, 1.0, 1000.0];
		this.view = mat4.create();
	
		mat4.identity(this.view);
		this.update_camera();
	}
};
