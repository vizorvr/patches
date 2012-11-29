E2.p = E2.plugins["particle_mesh_generator"] = function(core, node)
{
	this.desc = 'Create a mesh of <b>count</b> unconnected vertices at the origin.';
	
	this.input_slots = [
		{ name: 'count', dt: core.datatypes.FLOAT, desc: 'Number of vertices to generate.', lo: 1, hi: 65535, def: 10 }
	];
	
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

E2.p.prototype.update_input = function(slot, data)
{
	this.count = data < 1 ? 1 : data > 65535 ? 65535 : data;
	this.generate_mesh();
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};

E2.p.prototype.generate_mesh = function()
{
	var verts = this.mesh.vertex_buffers['VERTEX'];
	var vdata, i, len = this.count * 3, ofs = 0;

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

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		var gl = this.gl;
		
		this.count = 10;
		this.mesh = new Mesh(gl, gl.POINTS);
		this.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX);
		this.generate_mesh();
	}
};
