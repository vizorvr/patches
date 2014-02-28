E2.p = E2.plugins["scene_renderer_emitter"] = function(core, node) {
	this.desc = 'Render the supplied <b>scene</b>. If no <b>shader</b> is specified, the internal shaders of the scene meshes are used.';
	
	this.input_slots = [ 
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The scene to be rendered.', def: 'Render nothing.' },
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'If a material is specified, internal shaders are generated to render each scene mesh using this material as an overload.', def: 'Use scene materials and shaders.' },
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'The camera to use for rendering.', def: 'Screenspace camera.' },
		{ name: 'transform', dt: core.datatypes.MATRIX, desc: 'The scene transform to use for rendering.', def: 'Identity' },
		{ name: 'inv. transform', dt: core.datatypes.BOOL, desc: 'Send true to this slot to apply <b>transform</b> in inverse order when rendering instances.', def: 'False' }
	];
	
	this.output_slots = [];
	
	this.gl = core.renderer.context;
};

E2.p.prototype.reset = function()
{
	this.scene = null;
	this.shader = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		if(data !== this.scene)
		{
			this.scene = data;
		
			if(!this.ext_camera)
				this.camera = this.scene.create_autofit_camera();
			
			this.material_dirty = true;
		}
	}
	else if(slot.index === 1)
	{
		this.material = data;
		
		var caps = Material.get_caps_hash(null, data);
		
		if(this.material_caps !== caps)
		{
			this.material_caps = caps;
			this.material_dirty = true;
		}
	}
	else if(slot.index === 2)
	{
		this.camera = data;
		this.ext_camera = true;
	}
	else if(slot.index === 3)
		this.transform = data;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on)
	{
		if(slot.index === 0)
		{
			this.scene = null;
			this.material_dirty = true;
		}
		else if(slot.index === 1)
		{
			this.material = null;
			this.material_caps = '';
			this.overload_shaders = null;
		}
		else if(slot.index === 2)
		{
			this.ext_camera = false;
			
			if(this.scene)
				this.camera = this.scene.create_autofit_camera();
		}
	}
};

E2.p.prototype.update_state = function()
{
	if(this.scene)
	{
		if(this.material_dirty && this.material)
		{
			this.overload_shaders = this.scene.build_overload_shaders(this.material)
			this.material_dirty = false;
		}
		
		this.transform.invert = this.inv_transform;
		this.scene.render(this.gl, this.camera, this.transform, this.overload_shaders, this.material);
	}
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.material = null;
		this.material_caps = '';
		this.material_dirty = false;
		this.overload_shaders = null;
		this.camera = new Camera();
		this.transform = mat4.create();

		mat4.identity(this.transform);
		this.ext_camera = false;
		this.inv_transform = false;
	}
};

