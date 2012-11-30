E2.p = E2.plugins["sphere_mesh_generator"] = function(core, node)
{
	this.desc = 'Create a sphere mesh of unit size with normals and one set of UV-cordinates. Vertical and horizontal resolution is customizable.';
	
	this.input_slots = [
		{ name: 'v res', dt: core.datatypes.FLOAT, desc: 'Vertical resolution.', lo: 3, hi: 25, def: 15 },
		{ name: 'h res', dt: core.datatypes.FLOAT, desc: 'Horizontal resolution.', lo: 3, hi: 25, def: 15 }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Sphere mesh.' }
	];
	
	this.state = { v_res: 15, h_res: 15 };
	this.gl = core.renderer.context;
	this.mesh = null;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0 && this.state.v_res !== Math.floor(data) && data > 1)
	{
		this.state.v_res = Math.floor(data < 3.0 ? 3.0 : data > 25.0 ? 25.0 : data);
		this.dirty = true;
	}
	else if(slot.index === 1 && this.state.h_res !== Math.floor(data) && data > 1)
	{
		this.state.h_res = Math.floor(data < 3.0 ? 3.0 : data > 25.0 ? 25.0 : data);
		this.dirty = true;
	}
};

E2.p.prototype.update_state = function(delta_t)
{
	if(this.dirty)
	{
		this.generate_mesh();
		this.dirty = false;
	}
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};

E2.p.prototype.generate_mesh = function()
{
	var gl = this.gl;
	
	msg('Sphere: Generating mesh.');
	this.mesh = new Mesh(gl, gl.TRIANGLES);

	var verts = [], norms = [], uvs = [], indices = [];
	var d_ang_v = Math.PI / this.state.v_res; 
	var d_ang_h = (2.0 * Math.PI) / this.state.h_res;
	var index = 0;
	var v_res = this.state.v_res;
	var h_res = this.state.h_res;
	
	for(var v = 0; v < v_res + 1; v++)
	{
		var r0 = Math.sin(v * d_ang_v);
		var y0 = Math.cos(v * d_ang_v);
		
		for(var h = 0; h < h_res + 1; h++)
		{
			var x0 = r0 * Math.sin(h * d_ang_h);
			var z0 = r0 * Math.cos(h * d_ang_h);
			
			verts.push(x0);
			verts.push(y0);
			verts.push(z0);
			
			var l = Math.sqrt((x0 * x0) + (y0 * y0) + (z0 * z0));
		
			if(l < 0.00001)
				l = 1.0;
			
			l = 1.0 / l;
			norms.push(x0 * l);
			norms.push(y0 * l);
			norms.push(z0 * l);
			
			uvs.push(h / h_res);
			uvs.push(1.0 - (v / v_res));
			
			if(v !== v_res)
			{
				indices.push(index + h_res + 1);
				indices.push(index);
				indices.push(index + h_res);
				indices.push(index + h_res + 1);
				indices.push(index + 1);
				indices.push(index);
				
				index++;
			} 
		}
	}

	var vb = this.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX);
	
	vb.bind_data(verts);
	delete verts;
	
	var nb = this.mesh.vertex_buffers['NORMAL'] = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL);
	
	nb.bind_data(norms);
	delete norms;

	var uvb = this.mesh.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0);
	
	uvb.bind_data(uvs);
	delete uvs;

	var ib = this.mesh.index_buffer = new IndexBuffer(gl);
	
	ib.bind_data(indices);
	delete indices;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.generate_mesh();
		this.dirty = false;
	}
};
