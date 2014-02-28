E2.p = E2.plugins["convert_matrices_camera"] = function(core, node)
{
	this.desc = 'Create a new camera from a projection and view matrix.';
	
	this.input_slots = [ 
		{ name: 'projection', dt: core.datatypes.MATRIX, desc: 'The projection matrix.', def: 'Identity' },
		{ name: 'view', dt: core.datatypes.MATRIX, desc: 'The view matrix.', def: 'Identity' } 
	];
	
	this.output_slots = [ 
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The resulting camera.', def: 'Screenspace camera' }
	];
	
	this.gl = core.renderer.context;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.camera.projection = data;
	else
		this.camera.view = data;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.camera;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.camera = new Camera(this.gl);
};

