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

			var msk = data.get_light_mask();
			
			if(self.lightmask !== msk)
			{
				self.dirty = true;
				self.lightmask = msk;
			}
		}
	};
	
	this.update_state = function(delta_t)
	{
		if(!self.mesh)
			return;
		
		if(self.dirty)
		{
			self.dirty = false;
			self.shader = ComposeShader(E2.app.core.renderer.shader_cache, self.mesh, self.material, null, null, null, null);
		}
		else
			self.shader.material = self.material;
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
			self.dirty = true;
			self.lightmask = Light.mask_no_light;
		}
	};
};
