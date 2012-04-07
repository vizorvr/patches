E2.plugins["mesh_renderer_emitter"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [ 
		{ name: 'mesh', dt: core.datatypes.MESH },
		{ name: 'shader', dt: core.datatypes.SHADER }
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
        	var shader = self.shader;
        	
        	if(!mesh || !shader)
        		return;
        		
        	var verts = mesh.vertex_buffers['VERTEX'];
        	
        	if(!verts)
        		return;
        	
        	shader.enable();
        	
        	for(var v_type in VertexBuffer.vertex_type)
        	{
        		var vb = mesh.vertex_buffers[v_type];
        		
        		if(vb)
        			vb.bind_to_shader(shader);
        	}

       		shader.apply_uniforms();
       		
       		if(!mesh.index_buffer)
        		gl.drawArrays(mesh.prim_type, 0, verts.count);
		else
		{
			mesh.index_buffer.enable();
			gl.drawElements(mesh.prim_type, mesh.index_buffer.count, gl.UNSIGNED_SHORT, 0);
		}
	};
};
