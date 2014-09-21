E2.p = E2.plugins["array_to_mesh_modulator"] = function(core, node)
{
	this.desc = 'Converts the supplied array to a mesh.';
	
	this.input_slots = [ 
		{ name: 'vertices', dt: core.datatypes.ARRAY, desc: 'The vertex array (x, y, z).', def: null },
		{ name: 'normals', dt: core.datatypes.ARRAY, desc: 'The normal array (x, y, z).', def: null },
		{ name: 'colors', dt: core.datatypes.ARRAY, desc: 'The vertex color array (r, g, b, a).', def: null },
		{ name: 'uv0', dt: core.datatypes.ARRAY, desc: 'The first UV coord array (x, y).', def: null },
		{ name: 'uv1', dt: core.datatypes.ARRAY, desc: 'The second UV coord array (x, y).', def: null },
		{ name: 'uv2', dt: core.datatypes.ARRAY, desc: 'The third UV coord array (x, y).', def: null },
		{ name: 'uv3', dt: core.datatypes.ARRAY, desc: 'The forth UV coord array (x, y).', def: null },
		{ name: 'index', dt: core.datatypes.ARRAY, desc: 'The index buffer (depends on primitive type).', def: null }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The resulting mesh.' }
	];
	
	this.gl = core.renderer.context;
	this.mesh = new Mesh(this.gl, this.gl.TRIANGLES);
	this.vertices = null;
	this.normals = null;
	this.colors = null;
	this.uv0 = null;
	this.uv1 = null;
	this.uv2 = null;
	this.uv3 = null;
};

E2.p.prototype.update_vertex_buffer = function(v_name, v_type, data)
{
	var vbs = this.mesh.vertex_buffers;
	
	if(data)
	{
		if(!vbs[v_name])
			vbs[v_name] = new VertexBuffer(this.gl, v_type);
		
		vbs[v_name].bind_data(data, this.gl.DRAW_DYNAMIC);
	}
	else
		vbs[v_name] = null;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.update_vertex_buffer('VERTEX', VertexBuffer.vertex_type.VERTEX, data);
	else if(slot.index === 1)
		this.update_vertex_buffer('NORMAL', VertexBuffer.vertex_type.NORMAL, data);
	else if(slot.index === 2)
		this.update_vertex_buffer('COLOR', VertexBuffer.vertex_type.NORMAL, data);
	else if(slot.index === 3)
		this.update_vertex_buffer('UV0', VertexBuffer.vertex_type.UV0, data);
	else if(slot.index === 4)
		this.update_vertex_buffer('UV1', VertexBuffer.vertex_type.UV1, data);
	else if(slot.index === 5)
		this.update_vertex_buffer('UV2', VertexBuffer.vertex_type.UV2, data);
	else if(slot.index === 6)
		this.update_vertex_buffer('UV3', VertexBuffer.vertex_type.UV3, data);
	else if(slot.index === 7)
	{
		var ib = this.mesh.index_buffer;
	
		if(data)
		{
		
			if(!ib)
				ib = new IndexBuffer(this.gl);
		
			ib.bind_data(data);
		}
		else
			ib = null;
	}
};	

E2.p.prototype.update_state = function()
{
	var count = 0;
	var vbs = this.mesh.vertex_buffers;
	
	if(vbs['VERTEX'])
		count = Math.max(count, vbs['VERTEX'].count);
	
	this.mesh.generate_shader();
	this.mesh.vertex_count = count;
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};
