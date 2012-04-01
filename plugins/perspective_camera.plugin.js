E2.plugins["perspective_camera"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	var up = [0.0, 1.0, 0.0];
	
	this.input_slots = [
		{ name: 'FOV', dt: core.datatypes.FLOAT },
		{ name: 'near', dt: core.datatypes.FLOAT },
		{ name: 'far', dt: core.datatypes.FLOAT },
		{ name: 'position', dt: core.datatypes.VERTEX },
		{ name: 'target', dt: core.datatypes.VERTEX }
	];
	this.output_slots = [ { name: 'camera', dt: core.datatypes.CAMERA } ];

	this.reset = function()
	{
		self.camera = new Camera(gl);
		self.fov = 30.0;
		self.near = 0.01;
		self.far = 1000.0;
		self.position = [0.0, 0.0, 1.0];
		self.target = [0.0, 0.0, -1.0];
	};
	
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
		
		mat4.perspective(self.fov * Math.PI / 180.0, c.width() / c.height(), self.near, self.far, self.camera.projection);
		mat4.lookAt(self.position, self.target, up, self.camera.view);
	};
	
	this.update_output = function(slot)
	{
		return self.camera;
	};	
};
