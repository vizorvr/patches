E2.p = E2.plugins["plane_mesh_unindexed_generator"] = function(core, node)
{
	this.desc = 'Create a planar texture mapped triangle mesh in the XY-plane of unit size.';
	
	this.input_slots = [
		{ name: 'x res', dt: core.datatypes.FLOAT, desc: 'X resolution.', lo: 1, hi: 65536, def: 10 },
		{ name: 'y res', dt: core.datatypes.FLOAT, desc: 'Y resolution.', lo: 1, hi: 65536, def: 10 }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Plane mesh.' }
	];
	
	this.gl = core.renderer.context;
	this.state = { x_res: 10, y_res: 10 };
	this.mesh = null;
};

E2.p.prototype.reset = function()
{
	this.updated = true;
};

E2.p.prototype.update_input = function(slot, data)
{
	var v = Math.max(1, Math.min(Math.floor(data), 65536));
	
	if(slot.index === 0 && this.state.x_res !== v)
	{
		this.state.x_res = v;
		this.dirty = true;
	}
	else if(slot.index === 1 && this.state.y_res !== v)
	{
		this.state.y_res = v;
		this.dirty = true;
	}
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
	this.mesh = new Mesh(gl, gl.TRIANGLES, null);
	var xr = this.state.x_res;
	var yr = this.state.y_res;
	
	var v_data = [];
	var n_data = [];
	var uv_data = [];
	var xf = 1.0 / xr;
	var yf = 1.0 / yr;
	var o = 0;
	
	for(var y = 0, yo = 0.0; y < yr; y++, yo += yf)
	{
		for(var x = 0, xo = 0.0; x < xr; x++, xo += xf, o += 4)
		{
			v_data.push(xo + xf);
			v_data.push(yo + yf);
			v_data.push(0.0);
			uv_data.push(xo + xf);
			uv_data.push(yo + yf);

			v_data.push(xo);
			v_data.push(yo + yf);
			v_data.push(0.0);
			uv_data.push(xo);
			uv_data.push(yo + yf);

			v_data.push(xo);
			v_data.push(yo);
			v_data.push(0.0);
			uv_data.push(xo);
			uv_data.push(yo);

			v_data.push(xo);
			v_data.push(yo);
			v_data.push(0.0);
			uv_data.push(xo);
			uv_data.push(yo);

			v_data.push(xo + xf);
			v_data.push(yo);
			v_data.push(0.0);
			uv_data.push(xo + xf);
			uv_data.push(yo);

			v_data.push(xo + xf);
			v_data.push(yo + yf);
			v_data.push(0.0);
			uv_data.push(xo + xf);
			uv_data.push(yo + yf);


			for(var i = 0; i < 6; i++)
			{
				n_data.push(0.0);
				n_data.push(0.0);
				n_data.push(1.0);
			}
		}
	}

	for(var i = 0; i < yr * xr * 6 * 3; i += 3)
	{
		v_data[i] = (v_data[i] * 2.0) - 1.0;	
		v_data[i+1] = (v_data[i+1] * 2.0) - 1.0;
	}
	
	this.mesh.vertex_count = yr * xr * 6;
	this.mesh.stream_count = 3;
	this.mesh.streams_loaded = 3;
	
	(this.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX)).bind_data(v_data);
	(this.mesh.vertex_buffers['NORMAL'] = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL)).bind_data(n_data);
	(this.mesh.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0)).bind_data(uv_data);

	this.mesh.generate_shader();
	this.dirty = false;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.generate_mesh();
};
