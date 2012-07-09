E2.plugins["scene_renderer_emitter"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Render the supplied scene. If no shader is specified, the internal shaders of the scene meshes are used.';
	this.input_slots = [ 
		{ name: 'scene', dt: core.datatypes.SCENE },
		{ name: 'shader', dt: core.datatypes.SHADER },
		{ name: 'camera', dt: core.datatypes.CAMERA },
		{ name: 'transform', dt: core.datatypes.TRANSFORM }
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
			self.scene = data;
		else if(slot.index === 1)
			self.shader = data;
		else if(slot.index === 2)
			self.camera = data;
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
		}
	};
};
