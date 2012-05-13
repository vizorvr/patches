E2.plugins["mesh_renderer_emitter"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Render the supplied mesh. If no shader is specified, the internal shader (if any) of the mesh is used.';
	this.input_slots = [ 
		{ name: 'mesh', dt: core.datatypes.MESH },
		{ name: 'shader', dt: core.datatypes.SHADER },
		{ name: 'camera', dt: core.datatypes.CAMERA },
		{ name: 'transform', dt: core.datatypes.TRANSFORM }
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
