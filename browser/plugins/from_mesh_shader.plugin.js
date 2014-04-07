E2.p = E2.plugins["from_mesh_shader"] = function(core, node)
{
	this.desc = 'Auto-generate a shader tailored to correctly and optimally render the supplied mesh.';
	
	this.input_slots = [
		 { name: 'mesh', dt: core.datatypes.MESH, desc: 'Mesh to adapt the shader to.', def: null },
		 { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The surface material.', def: null }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	];
	
	this.shader = null;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
	{
		if(slot.index === 0)
			this.shader = null;
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		if(this.mesh !== data)
		{
			this.mesh = data;
			this.dirty = true;
		}
	}
	else if(slot.index === 1)
	{
		this.material = data;
	}
};

E2.p.prototype.update_state = function()
{
	if(!this.mesh)
		return;
	
	var caps = Material.get_caps_hash(this.mesh, this.material);

	if(!this.dirty && this.caps_hash === caps)
	{
		this.shader.material = this.material;
		return;
	}
	
	if(this.dirty || this.caps_hash !== caps)
	{
		msg('Recomposing shader with caps: ' + caps);
		this.shader = ComposeShader(null, this.mesh, this.material, null, null, null, null);
	}

	this.caps_hash = caps;
	this.updated = true;
	this.dirty = false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.shader;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.mesh = null;
		this.material = null;
		this.caps_hash = '';
		this.dirty = true;
	}
};
