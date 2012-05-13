E2.plugins["scene_get_mesh_count"] = function(core, node) {
	var self = this;
	
	this.desc = 'Emit the number of meshes in the supplied scene. Note that the maximum index is one less than the mesh count emitted by this plugin.';
	this.input_slots = [ { name: 'scene', dt: core.datatypes.SCENE } ];
	this.output_slots = [ { name: 'count', dt: core.datatypes.FLOAT } ];
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
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
