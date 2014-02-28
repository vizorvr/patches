E2.p = E2.plugins["grid_mesh_generator"] = function(core, node)
{
	this.desc = 'Create a planar grid mesh in the XY-plane of unit size.';
	
	this.input_slots = [
		{ name: 'x res', dt: core.datatypes.FLOAT, desc: 'X resolution.', lo: 2, hi: 250, def: 10 },
		{ name: 'y res', dt: core.datatypes.FLOAT, desc: 'Y resolution.', lo: 2, hi: 250, def: 10 }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Grid mesh.' }
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
	var v = Math.floor(data);
	
	if(v < 2)
		return;
	
	v = v > 250 ? 250 : v;
	
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
	
	this.mesh = new Mesh(gl, gl.LINES, null);
	
	var v_data = [];
	
	for(var y = 0; y < this.state.y_res + 1; y++)
	{
		var ofs = (y / (this.state.y_res / 2.0)) - 1.0;
		
		v_data.push(-1.0);		
		v_data.push(ofs);		
		v_data.push(0.0);		
		v_data.push(1.0);		
		v_data.push(ofs);		
		v_data.push(0.0);		
	}

	for(var x = 0; x < this.state.x_res + 1; x++)
	{
		var ofs = (x / (this.state.x_res / 2.0)) - 1.0;
		
		v_data.push(ofs);		
		v_data.push(-1.0);		
		v_data.push(0.0);		
		v_data.push(ofs);		
		v_data.push(1.0);		
		v_data.push(0.0);		
	}

	(this.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX)).bind_data(v_data);
	this.mesh.generate_shader();
	this.dirty = false;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.generate_mesh();
};
