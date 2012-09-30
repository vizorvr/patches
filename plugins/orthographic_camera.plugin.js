E2.plugins["orthographic_camera"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Create a orthographic camera, i.e a 3d-camera with no perspectivation (isometric).';
	this.input_slots = [
		{ name: 'left', dt: core.datatypes.FLOAT, desc: 'Left plane x-coordinate.', def: -1 },
		{ name: 'right', dt: core.datatypes.FLOAT, desc: 'Right plane x-coordinate.', def: 1 },
		{ name: 'top', dt: core.datatypes.FLOAT, desc: 'Top plane y-coordinate.', def: -1 },
		{ name: 'bottom', dt: core.datatypes.FLOAT, desc: 'Bottom plane y-coordinate.', def: 1 },
		{ name: 'near', dt: core.datatypes.FLOAT, desc: 'Near plane z-coordinate.', def: 1 },
		{ name: 'far', dt: core.datatypes.FLOAT, desc: 'Far plane x-coordinate.', def: 1000 },
		{ name: 'transform', dt: core.datatypes.MATRIX, desc: 'Camera transform.', def: 'Identity' }
	];
	this.output_slots = [ { name: 'camera', dt: core.datatypes.CAMERA, desc: 'The resulting camera.' } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index < 6)
			self.params[slot.index] = data;
		else
			self.view = data;
	};
	
	this.update_state = function()
	{
		self.update_camera();
	};

	this.update_camera = function()
	{
		var p = self.params;
		
		self.camera = new Camera();
		mat4.ortho(p[0], p[1], p[2], p[3], p[4], p[5], self.camera.projection);
		self.camera.view = self.view;
	};
	
	this.update_output = function(slot)
	{
		return self.camera;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.camera = new Camera();
			self.params = [-1.0, 1.0, -1.0, 1.0, 1.0, 1000.0];
			self.view = mat4.create();
		
			mat4.identity(self.view);
			self.update_camera();
		}
	};
};
