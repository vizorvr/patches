E2.plugins["scene_renderer_emitter"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Render the supplied <b>scene</b>. If no <b>shader</b> is specified, the internal shaders of the scene meshes are used.';
	this.input_slots = [ 
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The scene to be rendered.', def: 'Render nothing.' },
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'A shader to use in favour of the ones specified by the individual meshes in the scene.', def: 'Use mesh shaders.' },
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The camera to use for rendering.', def: 'Screenspace camera.' },
		{ name: 'transform', dt: core.datatypes.TRANSFORM, desc: 'The scene transform to use for rendering.', def: 'Identity' }
	];
	
	this.output_slots = [];

	this.reset = function()
	{
		self.scene = null;
		self.shader = null;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
		{
			self.scene = data;
			
			if(!self.ext_camera)
				self.camera = self.scene.create_autofit_camera();
		}
		else if(slot.index === 1)
			self.shader = data;
		else if(slot.index === 2)
		{
			self.camera = data;
			self.ext_camera = true;
		}
		else if(slot.index === 3)
			self.transform = data;
	};

	this.connection_changed = function(on, conn, slot)
	{
		if(!on)
		{
			if(slot.index === 0)
				self.scene = null;
			else if(slot.index === 1)
				self.shader = null;
			else if(slot.index === 2)
			{
				self.ext_camera = false;
				
				if(self.scene)
					self.camera = self.scene.create_autofit_camera();
			}
		}
	};
	
	this.update_state = function(delta_t)
	{
		if(self.scene)
			self.scene.render(gl, self.camera, self.transform, self.shader);
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.camera = new Camera();
			self.transform = mat4.create();

			mat4.identity(self.transform);
			self.ext_camera = false;
		}
	};
};
