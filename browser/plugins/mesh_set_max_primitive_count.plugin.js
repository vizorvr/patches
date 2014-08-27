E2.p = E2.plugins["mesh_set_max_primitive_count"] = function(core, node)
{
	this.desc = 'Sets the maximumber number of primitives in the supplied mesh to render.';
	
	this.input_slots = [ 
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Input mesh.', def: null },
		{ name: 'max', dt: core.datatypes.FLOAT, desc: 'Maximum number of primitives to draw (-1 = all).', def: -1 }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The input mesh.' }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.mesh = data;
	else
		this.max_count = data === -1 ? null : data;
};

E2.p.prototype.update_state = function()
{
	if(!this.mesh)
		return;
	
	this.mesh.max_prims = this.max_count;
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.mesh = null;
		this.max_count = null;
	}
};
