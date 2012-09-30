E2.plugins["mesh_renderer_emitter"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Render the supplied <b>mesh</b>. If no <b>shader</b> is specified, the internal shader (if any) of the <b>mesh</b> is used.';
	this.input_slots = [ 
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The input mesh to be rendered.' },
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'Connect to this slot to use the supplied shader in favor of the one specified by the mesh (if any).', def: 'Use mesh shader' },
		{ name: 'camera', dt: core.datatypes.CAMERA, desc: 'Camera to use for rendering.', def: 'Screenspace camera.' },
		{ name: 'transform', dt: core.datatypes.MATRIX, desc: 'Mesh transform.', def: 'Identity' }
	];
	
	this.output_slots = [];

	this.reset = function()
	{
		self.mesh = null;
		self.shader = null;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.mesh = data;
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
				self.mesh = null;
			else if(slot.index === 1)
				self.shader = null;
		}
	};
	
	this.update_state = function(delta_t)
	{
        	var mesh = self.mesh;
        	
        	if(!mesh)
        		return;
        		
		mesh.render(self.camera, self.transform, self.shader ? self.shader : mesh.shader);
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			this.camera = new Camera();
			self.transform = mat4.create();

			mat4.identity(self.transform);
		}
	};
};
