g_Plugins["screenspace_camera"] = function(core) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'camera', dt: core.datatypes.CAMERA } ];

	this.reset = function(ui)
	{
		self.camera = new Camera(gl);
	};
	
	this.update_output = function(index)
	{
		return self.camera;
	};	
};
