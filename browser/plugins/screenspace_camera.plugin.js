E2.p = E2.plugins["screenspace_camera"] = function(core, node)
{
	this.desc = 'Create a screen space (2D) camera suitable for display of XY-planar data, like quads.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'Screenspace camera.' }
	];

	this.gl = core.renderer.context;
};

E2.p.prototype.reset = function()
{
	this.camera = new Camera(this.gl);
};

E2.p.prototype.update_output = function(slot)
{
	return this.camera;
};
