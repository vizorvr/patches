E2.p = E2.plugins["mesh_primtype_modulator"] = function(core, node)
{
	this.desc = 'Sets the rendering primitive type of the supplied mesh.';
	
	this.input_slots = [ 
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Input mesh.', def: null },
		{ name: 'type', dt: core.datatypes.FLOAT, desc: 'The primitive type to use for the rendering of <b>mesh</b>. See also Generators/Values/Mesh primitive type.', def: core.renderer.context.TRIANGLES }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The modified mesh.' }
	];
	
	this.gl = core.renderer.context;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.mesh = data;
	else if(slot.index === 1)
		this.prim_type = Math.round(data);
};

E2.p.prototype.update_state = function()
{
	if(!this.mesh)
		return;
		
	this.mesh.prim_type = this.prim_type;
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
		this.prim_type = this.gl.TRIANGLES;
	}
};
