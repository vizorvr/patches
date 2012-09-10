E2.plugins["screenspace_camera"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Create a screen space (2D) camera suitable for display of XY-planar data, like quads.';
	this.input_slots = [];
	this.output_slots = [ { name: 'camera', dt: core.datatypes.CAMERA, desc: 'Screenspace camera.' } ];

	this.reset = function()
	{
		self.camera = new Camera(gl);
	};
	
	this.update_output = function(slot)
	{
		return self.camera;
	};	
};
