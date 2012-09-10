E2.plugins["scene_get_mesh_count"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emits the number of meshes in the supplied <b>scene</b>. Note that the maximum index is one less than the mesh <b>count</b>.';
	this.input_slots = [ { name: 'scene', dt: core.datatypes.SCENE, desc: 'The scene to obtain the mesh count from.' } ];
	this.output_slots = [ { name: 'count', dt: core.datatypes.FLOAT, desc: 'The number of meshes in the supplied <b>scene</b>. Note that mesh indices are zero-index, so the highest mesh index in a scene is count - 1.', def: 0 } ];
	
	this.update_input = function(slot, data)
	{
		self.scene = data;
	};	

	this.update_state = function(delta_t)
	{
		self.count = self.scene ? self.scene.meshes.length : 0;
	};
	
	this.update_output = function(slot)
	{
		return self.count;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.scene = null;
			self.count = 0;
		}
	};
};
