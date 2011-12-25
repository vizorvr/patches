g_Plugins["perspective_camera"] = function(core) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [
		{ name: 'FOV', dt: core.datatypes.FLOAT },
		{ name: 'near', dt: core.datatypes.FLOAT },
		{ name: 'far', dt: core.datatypes.FLOAT },
		{ name: 'position', dt: core.datatypes.VECTOR },
		{ name: 'target', dt: core.datatypes.VECTOR }
	];
	this.output_slots = [ { name: 'camera', dt: core.datatypes.CAMERA } ];
	this.state = null;
	this.camera = new Camera(gl);
	this.fov = 45.0;
	this.near = 0.01;
	this.far = 100.0;
	this.position = [0.0, 0.0, 1.0];
	this.target = [0.0, 0.0, 0.0];
	
	this.update_input = function(index, data)
	{
		if(index === 0)
			self.fov = data;
		else if(index === 1)
			self.near = data;
		else if(index === 2)
			self.far = data;
		else if(index === 3)
			self.position = data;
		else if(index === 3)
			self.target = data;
	};

	this.update_state = function()
	{
		mat4.perspective(self.fov, gl.viewportWidth / gl.viewportHeight, self.near, self.far, self.camera.projection);
		mat4.lookAt(self.position, self.target, [0.0, 1.0, 0.0], self.camera.view);
	};
	
	this.update_output = function(index)
	{
		return self.camera;
	};	
};
