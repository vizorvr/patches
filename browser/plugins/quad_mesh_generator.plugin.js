E2.p = E2.plugins["quad_mesh_generator"] = function(core, node)
{
	this.desc = 'Create a planar quad mesh in the XY-plane of unit size with normals and one set of UV-cordinates.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Quad mesh.' }
	];
	
	this.gl = core.renderer.context;
	this.mesh = null;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		var gl = this.gl;
		
		this.mesh = new Mesh(gl, gl.TRIANGLE_STRIP, null);
		
		var verts = this.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX);
		
		verts.bind_data([
			 1.0,  1.0,  0.0,
			-1.0,  1.0,  0.0,
			 1.0, -1.0,  0.0,
			-1.0, -1.0,  0.0
		]);
			
		var norms = this.mesh.vertex_buffers['NORMAL'] = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL);
		
		norms.bind_data([
			0.0,  0.0,  1.0,
			0.0,  0.0,  1.0,
			0.0,  0.0,  1.0,
			0.0,  0.0,  1.0
		]);

		var uv0 = this.mesh.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0);
		
		uv0.bind_data([
			 1.0,  1.0,
			 0.0,  1.0,
			 1.0,  0.0,
			 0.0,  0.0
		]);

		var indices = this.mesh.index_buffer = new IndexBuffer(gl);
		
		indices.bind_data([ 3, 1, 0, 3, 2, 0 ]);
		this.mesh.generate_shader();
	}
};
