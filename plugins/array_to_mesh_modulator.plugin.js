E2.p = E2.plugins["array_to_mesh_modulator"] = function(core, node)
{
	this.desc = 'Converts the supplied array to a mesh.';
	
	this.input_slots = [ 
		{ name: 'vertices', dt: core.datatypes.ARRAY, desc: 'The vertex array (x, y, z).' }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The resulting mesh.' }
	];
	
	this.gl = core.renderer.context;
	this.mesh = new Mesh(this.gl, this.gl.TRIANGLES);
	this.vertices = null;
};

E2.p.prototype.update_vertex_buffer = function(v_name, v_type, data)
{
	var vbs = this.mesh.vertex_buffers;
	
	if(data)
	{
		
		if(!vbs[v_type])
			vbs[v_name] = new VertexBuffer(this.gl, v_type);
		
		vbs[v_name].bind_data(data)
	}
	else
		vbs[v_name] = null;
	
	return data.length / VertexBuffer.type_stride[v_type];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.update_vertex_buffer('VERTEX', VertexBuffer.vertex_type.VERTEX, data);
};	

E2.p.prototype.update_state = function()
{
	var count = 0;
	var vbs = this.mesh.vertex_buffers;
	
	if(vbs['VERTEX'])
		count = Math.max(count, vbs['VERTEX'].count);
	
	this.vertex_count = count;
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};
