(function() {

var FromMeshShader = E2.plugins["from_mesh_shader"] = function(core, node)
{
	this.desc = 'Auto-generate a shader tailored to correctly and optimally render the supplied mesh.';
	
	this.input_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Mesh to adapt the shader to.', def: null },
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'The surface material.', def: null },
		
		// kk todo: replace with a more general fog input
		{ name: 'fog color', dt: core.datatypes.COLOR, desc: 'Fog color.', def: null },
		{ name: 'fog distance', dt: core.datatypes.FLOAT, desc: 'Fog distance.', def: 10.0 },
		{ name: 'fog steepness', dt: core.datatypes.FLOAT, desc: 'Fog steepness.', def: 1.0 }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	];
	
	this.shader = null;

	this.fog = {
		color: null,
		steepness: 1.0,
		distance: 10.0
	};
};

FromMeshShader.prototype.connection_changed = function(on, conn, slot)
{
	console.log("FromMeshShader connection_changed " + on + " " + slot.type + " " + slot.index);

	if(!on && slot.type === E2.slot_type.input)
	{
		if(slot.index === 0)
			this.shader = null;
	}
};

FromMeshShader.prototype.update_input = function(slot, data)
{
	//console.log("FromMeshShader update_input " + slot.index + " " + data);
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
	else if(slot.index === 2)
	{
		if(data !== null)
		{
			this.fog.color = vec4.createFrom(data[0], data[1], data[2], data[3]);
		}
		else
		{
			this.fog.color = null;
		}
	}
	else if(slot.index === 3)
	{
		this.fog.distance = data;
	}
	else if(slot.index === 4)
	{
		this.fog.steepness = data;
	}
};

FromMeshShader.prototype.update_state = function()
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
		this.shader = ComposeShader(null, this.mesh, this.material, null, null, null, null, null, null, this.fog.color === null ? undefined : this.fog);
	}

	this.caps_hash = caps;
	this.updated = true;
	this.dirty = false;
};

FromMeshShader.prototype.update_output = function(slot)
{
	return this.shader;
};

FromMeshShader.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.mesh = null;
		this.material = null;
		this.caps_hash = '';
		this.dirty = true;
	}
};

})();

