E2.plugins["scene_renderer_emitter"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Render the supplied <b>scene</b>. If no <b>shader</b> is specified, the internal shaders of the scene meshes are used.';
	this.input_slots = [ 
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The scene to be rendered.', def: 'Render nothing.' },
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'If a material is specified, internal shaders are generated to render each scene mesh using this material as an overload.', def: 'Use scene materials and shaders.' },
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The camera to use for rendering.', def: 'Screenspace camera.' },
		{ name: 'transform', dt: core.datatypes.MATRIX, desc: 'The scene transform to use for rendering.', def: 'Identity' },
		{ name: 'inv. transform', dt: core.datatypes.BOOL, desc: 'Send true to this slot to apply <b>transform</b> in inverse order when rendering instances.', def: 'False' }
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
				
			self.material_dirty = true;
		}
		else if(slot.index === 1)
		{
			self.material = data;
			
			var caps = Material.get_caps_hash(null, data);
			
			if(self.material_caps !== caps)
			{
				self.material_caps = caps;
				self.material_dirty = true;
			}
		}
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
			{
				self.scene = null;
				self.material_dirty = true;
			}
			else if(slot.index === 1)
			{
				self.material = null;
				self.material_caps = '';
				self.overload_shaders = null;
			}
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
		{
			if(self.material_dirty && self.material)
			{
				self.overload_shaders = self.scene.build_overload_shaders(self.material)
				self.material_dirty = false;
			}
			
			self.transform.invert = self.inv_transform;
			self.scene.render(gl, self.camera, self.transform, self.overload_shaders, self.material);
		}
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.material = null;
			self.material_caps = '';
			self.material_dirty = false;
			self.overload_shaders = null;
			self.camera = new Camera();
			self.transform = mat4.create();

			mat4.identity(self.transform);
			self.ext_camera = false;
			self.inv_transform = false;
		}
	};
};
