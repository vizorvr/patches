E2.plugins["from_mesh_shader"] = function(core, node) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.desc = 'Auto-generate a shader tailored to correctly and optimally render the supplied mesh.';
	this.input_slots = [
		 { name: 'mesh', dt: core.datatypes.MESH, desc: 'Mesh to adapt the shader to.' },
		 { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The surface material.' }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	];
	
	this.shader = null;
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input)
		{
			if(slot.index === 0)
			{
				self.mesh = null;
				self.shader = null;
			}
			else if(slot.index === 1)
				self.material = null;
		}
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
		{
			if(self.mesh !== data)
			{
				self.mesh = data;
				self.dirty = true;
			}
		}
		else if(slot.index === 1)
		{
			self.material = data;
		}
	};
	
	this.update_state = function(delta_t)
	{
		if(!self.mesh)
			return;
		
		var caps = Material.get_caps_hash(self.mesh, self.material);

		if(!self.dirty && self.caps_hash === caps)
		{
			self.shader.material = self.material;
			return;
		}
		
		self.caps_hash = caps;
		
		msg('Recomposing shader with caps: ' + self.caps_hash);
		self.shader = ComposeShader(core.renderer.shader_cache, self.mesh, self.material, null, null, null, null);
		self.updated = true;
		self.dirty = false;
	};
	
	this.update_output = function(slot)
	{
		return self.shader;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
			self.mesh = null;
			self.material = null;
			self.caps_hash = '';
			self.dirty = true;
		}
	};
};
