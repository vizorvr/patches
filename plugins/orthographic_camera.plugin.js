E2.plugins["orthographic_camera"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Create a orthographic camera.';
	this.input_slots = [
		{ name: 'left', dt: core.datatypes.FLOAT },
		{ name: 'right', dt: core.datatypes.FLOAT },
		{ name: 'top', dt: core.datatypes.FLOAT },
		{ name: 'bottom', dt: core.datatypes.FLOAT },
		{ name: 'near', dt: core.datatypes.FLOAT },
		{ name: 'far', dt: core.datatypes.FLOAT }
	];
	this.output_slots = [ { name: 'camera', dt: core.datatypes.CAMERA } ];
	
	this.reset = function()
	{
		var p = self.params = [-1.0, 1.0, -1.0, 1.0, 1.0, 1000.0];
		self.camera = Camera.create_ortho(gl, p[0], p[1], p[2], p[3], p[4], p[5]);
	};
	
	this.update_input = function(slot, data)
	{
		self.params[slot.index] = data;
	};
	
	this.update_state = function()
	{
		self.camera = Camera.create_ortho(gl, p[0], p[1], p[2], p[3], p[4], p[5]);
	};

	this.update_output = function(slot)
	{
		return self.camera;
	};	
};
