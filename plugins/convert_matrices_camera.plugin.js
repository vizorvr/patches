E2.plugins["convert_matrices_camera"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Create camera from a projection and view matrix.';
	this.input_slots = [ 
		{ name: 'projection', dt: core.datatypes.TRANSFORM },
		{ name: 'view', dt: core.datatypes.TRANSFORM } 
	];
	this.output_slots = [ 
		{ name: 'camera', dt: core.datatypes.CAMERA }
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
