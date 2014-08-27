E2.p = E2.plugins["mesh_get_primitive_count"] = function(core, node)
{
	this.desc = 'Gets the number of primitives in the supplied mesh.';
	
	this.input_slots = [ 
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Input mesh.', def: null }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The input mesh.' },
		{ name: 'prim count', dt: core.datatypes.FLOAT, desc: 'The number of primitives in the specified mesh.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	this.mesh = data;
};

E2.p.prototype.update_state = function()
{
	if(!this.mesh)
	{
		this.count = 0;
		return;
	}
	
	this.count = this.mesh.index_buffer ? this.mesh.index_buffer.count : this.mesh.vertex_buffers['VERTEX'].count;
	this.count /= this.mesh.get_stride();
};

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this.mesh;
	
	return this.count;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.mesh = null;
		this.count = 0;
	}
};
