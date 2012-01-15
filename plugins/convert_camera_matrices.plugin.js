g_Plugins["convert_camera_matrices"] = function(core) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [ 
		{ name: 'camera', dt: core.datatypes.CAMERA },
	];
	this.output_slots = [ 
		{ name: 'projection', dt: core.datatypes.MATRIX },
		{ name: 'view', dt: core.datatypes.MATRIX } 
	];
	
	this.reset = function(ui)
	{
		self.camera = new Camera(gl);
	};
	
	this.update_input = function(index, data)
	{
		self.camera = data;
	};	

	this.update_output = function(index)
	{
		if(index === 0)
			return self.camera.projection;
		else if(index === 1)
			return self.camera.view;
	};	
};
