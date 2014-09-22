E2.p = E2.plugins["csg_to_mesh_modulator"] = function(core, node)
{
	this.desc = 'Converts the supplied CSG object to a mesh.';
	
	this.input_slots = [ 
		{ name: 'csg', dt: core.datatypes.OBJECT, desc: 'The CSG object to convert.', def: null }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The resulting mesh.' }
	];
	
	core.add_aux_script('csg/csg.js');

	this.gl = core.renderer.context;
	this.mesh = null;
	this.csg = null;
};

E2.p.prototype.update_vertex_buffer = function(v_name, v_type, data)
{
	var vbs = this.mesh.vertex_buffers;
	
	if(data)
	{
		if(!vbs['VERTEX'])
			vbs['VERTEX'] = new VertexBuffer(this.gl, VertexBuffer.vertex_type.VERTEX);
		
		vbs['VERTEX'].bind_data(data, this.gl.DRAW_DYNAMIC);
	}
	else
		vbs['VERTEX'] = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.csg = (data instanceof CSG) ? data : null;
};	

E2.p.prototype.update_state = function()
{
	if(!this.csg)
	{
		this.mesh = null;
		return;
	}
	
	var mesh = new Mesh(this.gl, this.gl.TRIANGLES);
	var vbs = mesh.vertex_buffers;
	var vd = [];
	var nd = [];
	var polys = this.csg.polygons;
	
	// Poly-split in fans to triangulate.
	for(var i = 0; i < polys.length; i++)
	{
		var p = polys[i];
		var vs = p.vertices;
			
		vd.push(vs[0].pos.x, vs[0].pos.y, vs[0].pos.z);
		nd.push(vs[0].normal.x, vs[0].normal.y, vs[0].normal.z);
		vd.push(vs[1].pos.x, vs[1].pos.y, vs[1].pos.z);
		nd.push(vs[1].normal.x, vs[1].normal.y, vs[1].normal.z);
		vd.push(vs[2].pos.x, vs[2].pos.y, vs[2].pos.z);
		nd.push(vs[2].normal.x, vs[2].normal.y, vs[2].normal.z);
		
		for(var v = 3; v < p.vertices.length; v++)
		{
			vd.push(vs[0].pos.x, vs[0].pos.y, vs[0].pos.z);
			nd.push(vs[0].normal.x, vs[0].normal.y, vs[0].normal.z);
			vd.push(vs[v-1].pos.x, vs[v-1].pos.y, vs[v-1].pos.z);
			nd.push(vs[v-1].normal.x, vs[v-1].normal.y, vs[v-1].normal.z);
			vd.push(vs[v].pos.x, vs[v].pos.y, vs[v].pos.z);
			nd.push(vs[v].normal.x, vs[v].normal.y, vs[v].normal.z);
		}
	}
	
	vbs['VERTEX'] = new VertexBuffer(this.gl, VertexBuffer.vertex_type.VERTEX);
	vbs['VERTEX'].bind_data(vd, this.gl.DRAW_DYNAMIC);
	vbs['NORMAL'] = new VertexBuffer(this.gl, VertexBuffer.vertex_type.NORMAL);
	vbs['NORMAL'].bind_data(nd, this.gl.DRAW_DYNAMIC);
	
	this.mesh = mesh;
	this.mesh.generate_shader();
	this.vertex_count = vd.length;
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};
