E2.p = E2.plugins["convert_camera_matrices"] = function(core, node)
{
	this.desc = 'Extract the projection and view matrices from a camera.';
	
	this.input_slots = [ 
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The input camera to be split into constituent matrices.', def: 'Screenspace camera' },
	];
	
	this.output_slots = [ 
		{ name: 'projection', dt: core.datatypes.MATRIX, desc: 'The camera projection matrix.', def: 'Identity' },
		{ name: 'view', dt: core.datatypes.MATRIX, desc: 'The camera view matrix.', def: 'Identity' }
	];
	
	this.gl = core.renderer.context;
};

E2.p.prototype.reset = function()
{
	this.camera = new Camera(this.gl);
};

E2.p.prototype.update_input = function(slot, data)
{
	this.camera = data;
};	

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this.camera.projection;
	else
		return this.camera.view;
};
