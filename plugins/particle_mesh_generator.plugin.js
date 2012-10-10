E2.plugins["particle_mesh_generator"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Create a mesh of <b>count</b> unconnected vertices at the origin.';
	this.input_slots = [ { name: 'count', dt: core.datatypes.FLOAT, desc: 'Number of vertices to generate.', lo: 1, hi: 65535, def: 100 } ];
	this.output_slots = [ { name: 'mesh', dt: core.datatypes.MESH, desc: 'Quad mesh.' } ];
	this.mesh = null;
	
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.update_input = function(slot)
	{
		self.count = data < 1 ? 1 : data > 65535 ? 65535 : data;
		self.generate_mesh();
	};

	this.update_output = function(slot)
	{
		return self.mesh;
	};
	
	this.generate_mesh = function()
	{
		var verts = self.mesh.vertex_buffers['VERTEX'];
		var vdata, i, len = self.count * 3, ofs = 0;

		vdata = new Array(len);
	
		for(i = 0; i < len; i += 3)
		{ 
			vdata[i] = ofs;
			vdata[i+1] = 0;
			vdata[i+2] = 0;
			ofs++;
		}
		
		verts.bind_data(vdata);
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.count = 100;
			self.mesh = new Mesh(gl, gl.POINTS);	
			self.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX);
			self.generate_mesh();
		}
	};
};
