(function() {

var FromMeshShader = E2.plugins["from_mesh_shader"] = function(core, node)
{
	this.desc = 'Auto-generate a shader tailored to correctly and optimally render the supplied mesh.';
	
	this.input_slots = [
		{ name: 'mesh', dt: core.datatypes.MESH, desc: 'Mesh to adapt the shader to.', def: null },
		{ name: 'material', dt: core.datatypes.MATERIAL, desc: 'The surface material.', def: null },
		{ name: 'environment', dt: core.datatypes.ENVIRONMENT, desc: 'Environment', def: null }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	];
	
	this.shader = null;

	this.environment = null;
};

FromMeshShader.prototype.connection_changed = function(on, conn, slot)
{
	//console.log("FromMeshShader connection_changed " + on + " " + slot.type + " " + slot.index);

	if(!on && slot.type === E2.slot_type.input)
	{
		if(slot.index === 0) {
			this.shader = null;
		}

		if(slot.index === 2) {
			//this.shader = null;
		}
	}

	if(slot.index === 2) {
		this.dirty = true;
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
		//console.log('set environment ' + data + ' ' + data.fog + ' ' + data.fog.enabled);
		if (data) {
			this.environment = data;
			this.environment.fog.enabled = true;

			//console.log('fog color: ' + vec4.str(data.fog.color))
		}
		else {
			this.environment = null;
		}
		//this.dirty = true;
	}	
};

FromMeshShader.prototype.update_state = function()
{
	//console.log('FromMeshShader update_state()');
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
		this.shader = ComposeShader(null, this.mesh, this.material, null, null, null, null, null, null, this.environment);
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
	//console.log('FromMeshShader state_changed()');
	if(!ui)
	{
		this.mesh = null;
		this.material = null;
		this.caps_hash = '';
		this.dirty = true;
	}
};

})();

