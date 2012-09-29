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
			self.mesh = data;
			
			if(self.mesh)
			{
				self.shader = self.mesh.generate_shader();
				
				// Decorate with an apply_uniforms method that maps
				// our values to the generated shader.
				self.shader.apply_uniforms = function(mesh)
				{
					var mat = self.material ? self.material : mesh.material;
					
					gl.uniform4fv(this.diffuseColorUniform, new Float32Array(mat.diffuse_color.rgba));
					
					if(this.uv0CoordAttribute !== undefined)
					{
						var diffuse_set = false;

						gl.enableVertexAttribArray(self.shader.uv0CoordAttribute);
	
						if(self.material)
						{
							var dt = self.material.textures[Material.texture_type.DIFFUSE_COLOR];
			
							if(dt)
							{
								gl.uniform1i(this.tex0Uniform, 0);
								dt.enable(gl.TEXTURE0);
								diffuse_set = true;
							}
						}
		
						if(!diffuse_set)
						{
							var dt = mesh.material.textures[Material.texture_type.DIFFUSE_COLOR];
			
							if(dt)
							{
								gl.uniform1i(this.tex0Uniform, 0);
								dt.enable(gl.TEXTURE0);
							}
							else
							{
								gl.bindTexture(gl.TEXTURE_2D, null);
							}
						}
					}
					
					mat.enable();	
				};
			}
		}
		else if(slot.index === 1)
			self.material = data;
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
		}
	};
};
