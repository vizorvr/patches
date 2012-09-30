E2.plugins["convert_matrices_camera"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Create a new camera from a projection and view matrix.';
	this.input_slots = [ 
		{ name: 'projection', dt: core.datatypes.MATRIX, desc: 'The projection matrix.', def: 'Identity' },
		{ name: 'view', dt: core.datatypes.MATRIX, desc: 'The view matrix.', def: 'Identity' } 
	];
	this.output_slots = [ 
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The resulting camera.', def: 'Screenspace camera' }
	];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.camera.projection = data;
		else
			self.camera.view = data;
	};	

	this.update_output = function(slot)
	{
		return self.camera;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.camera = new Camera(gl);
		}
	};
};
