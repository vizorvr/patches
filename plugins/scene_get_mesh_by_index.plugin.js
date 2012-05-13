E2.plugins["scene_get_mesh_by_index"] = function(core, node) {
	var self = this;
	
	this.desc = 'Extract a single mesh from a scene by index, so it can be rendered individually.';
	this.input_slots = [ 
		{ name: 'scene', dt: core.datatypes.SCENE },
		{ name: 'index', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ { name: 'mesh', dt: core.datatypes.MESH } ];

	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input)
		{
			if(slot.index === 0)
				self.scene = null;
			else if(slot.index === 1)
				self.index = 0;
		}
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.scene = data;
		else if(slot.index === 1)
			self.index = Math.floor(data < 0 ? -data : data);
	};	

	this.update_state = function(delta_t)
	{
		if(self.scene)
		{
			var meshes = self.scene.meshes;
			var count = meshes.length;
			
			if(count < 1)
				return;
			
			self.mesh = meshes[self.index % count];
		}
	};
	
	this.update_output = function(slot)
	{
		return self.mesh;
	};	

	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.scene = null;
			self.index = 0;
			self.mesh = null;
		}
	};
};
