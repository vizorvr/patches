E2.plugins["quad_mesh_generator"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Create a planar quad mesh of unit size with normals and one set of UV-cordinates.';
	this.input_slots = [];
	this.output_slots = [ { name: 'mesh', dt: core.datatypes.MESH } ];
	this.mesh = null;
	
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.update_output = function(slot)
	{
		return self.mesh;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			msg('Quad: Generating mesh.');
			self.mesh = new Mesh(gl, gl.TRIANGLE_STRIP);
			
			var verts = self.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX);
			
			verts.bind_data([
				 1.0,  1.0,  0.0,
				-1.0,  1.0,  0.0,
				 1.0, -1.0,  0.0,
				-1.0, -1.0,  0.0
			]);
				
			var norms = self.mesh.vertex_buffers['NORMAL'] = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL);
			
			norms.bind_data([
				0.0,  0.0,  1.0,
				0.0,  0.0,  1.0,
				0.0,  0.0,  1.0,
				0.0,  0.0,  1.0
			]);

  			var uv0 = self.mesh.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0);
			
			uv0.bind_data([
				 1.0,  1.0,
				 0.0,  1.0,
				 1.0,  0.0,
				 0.0,  0.0
			]);
  
			var indices = self.mesh.index_buffer = new IndexBuffer(gl);
			
			indices.bind_data([ 3, 1, 0, 3, 2, 0 ]);
		}
	};
};
