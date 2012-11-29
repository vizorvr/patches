E2.p = E2.plugins["scene_get_mesh_count"] = function(core, node)
{
	this.desc = 'Emits the number of meshes in the supplied <b>scene</b>. Note that the maximum index is one less than the mesh <b>count</b>.';
	
	this.input_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The scene to obtain the mesh count from.' }
	];
	
	this.output_slots = [
		{ name: 'count', dt: core.datatypes.FLOAT, desc: 'The number of meshes in the supplied <b>scene</b>. Note that mesh indices are zero-index, so the highest mesh index in a scene is count - 1.', def: 0 }
	];
};

E2.p.prototype.update_input = function(slot, data)
{
	this.scene = data;
};	

E2.p.prototype.update_state = function(delta_t)
{
	this.count = this.scene ? this.scene.meshes.length : 0;
};

E2.p.prototype.update_output = function(slot)
{
	return this.count;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.scene = null;
		this.count = 0;
	}
};
