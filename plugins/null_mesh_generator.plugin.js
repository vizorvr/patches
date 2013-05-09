E2.p = E2.plugins["null_mesh_generator"] = function(core, node)
{
	this.desc = 'Create an orientation indication mesh.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Null mesh.' }
	];
	
	this.gl = core.renderer.context;
	this.mesh = null;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_state = function()
{
	if(this.dirty)
		this.generate_mesh();
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};

E2.p.prototype.generate_mesh = function()
{
	var gl = this.gl;
	
	this.mesh = new Mesh(gl, gl.LINES);
	
	(this.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX)).bind_data([
		0.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		
		0.0, 0.0, 0.0,
		0.0, 1.0, 0.0,

		0.0, 0.0, 0.0,
		0.0, 0.0, 1.0
	]);
	
	(this.mesh.vertex_buffers['COLOR'] = new VertexBuffer(gl, VertexBuffer.vertex_type.COLOR)).bind_data([
		1.0, 0.0, 0.0, 1.0,
		1.0, 0.0, 0.0, 1.0,
		
		0.0, 1.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,

		0.0, 0.0, 1.0, 1.0,
		0.0, 0.0, 1.0, 1.0
	]);

	this.dirty = false;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.generate_mesh();
};
