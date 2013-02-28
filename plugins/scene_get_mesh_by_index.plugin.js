E2.p = E2.plugins["scene_get_mesh_by_index"] = function(core, node)
{
	this.desc = 'Extract a single <b>mesh</b> from a <b>scene</b> by <b>index</b> so it can be rendered individually.';
	
	this.input_slots = [ 
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The scene to extract a mesh reference from.' },
		{ name: 'index', dt: core.datatypes.FLOAT, desc: 'The desired mesh index.' }
	];
	
	this.output_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'The extracted mesh reference.' }
	];
};

E2.p.prototype.reset = function()
{
	this.changed = true;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
	{
		if(slot.index === 0)
			this.scene = null;
		else if(slot.index === 1)
			this.index = 0;
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.scene = data;
	else if(slot.index === 1)
		this.index = Math.floor(data < 0 ? -data : data);
};	

E2.p.prototype.update_state = function()
{
	if(this.scene)
	{
		var meshes = this.scene.meshes;
		var count = meshes.length;
		
		if(count < 1)
			return;
		
		var m = meshes[this.index % count];
		
		if(m !== this.mesh)
		{
			this.mesh = m;
			return;
		}
	}

	if(!this.changed)
		this.updated = false;
		
	this.changed = false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.mesh;
};	

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.scene = null;
		this.index = 0;
		this.mesh = null;
		this.changed = true;
	}
};
