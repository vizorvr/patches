E2.plugins["perspective_camera"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	var up = [0.0, 1.0, 0.0];
	
	this.desc = 'Create a new perspective (3D) camera.';
	this.input_slots = [
		{ name: 'FOV', dt: core.datatypes.FLOAT, desc: 'Field of view in degrees.', def: 45 },
		{ name: 'near', dt: core.datatypes.FLOAT, desc: 'Depth of the near clipping plane.', def: 1 },
		{ name: 'far', dt: core.datatypes.FLOAT, desc: 'Depth of the far clipping plane.', def: 1000 },
		{ name: 'position', dt: core.datatypes.VERTEX, desc: 'Camera position.', def: '0, 0, -1' },
		{ name: 'target', dt: core.datatypes.VERTEX, desc: 'Camera target.', def: '0, 0, 0' }
	];
	this.output_slots = [ { name: 'camera', dt: core.datatypes.CAMERA, desc: 'The resulting camera.' } ];

	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.fov = data;
		else if(slot.index === 1)
			self.near = data;
		else if(slot.index === 2)
			self.far = data;
		else if(slot.index === 3)
			self.position = data;
		else
			self.target = data;
	};

	this.update_state = function()
	{
		var c = core.renderer.canvas;
		
		mat4.perspective(self.fov, c.width() / c.height(), self.near, self.far, self.camera.projection);
		mat4.lookAt(self.position, self.target, up, self.camera.view);
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
			self.fov = 45.0;
			self.near = 1.0;
			self.far = 1000.0;
			self.position = [0.0, 0.0, 1.0];
			self.target = [0.0, 0.0, -1.0];
		}
	};
};
