E2.plugins["from_mesh_shader"] = function(core, node) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.desc = 'Auto-generate a shader tailored to correctly and optimally render the supplied mesh.';
	this.input_slots = [
		 { name: 'mesh', dt: core.datatypes.MESH, desc: 'Mesh to adapt the shader to.' },
		 { name: 'is3d', dt: core.datatypes.BOOL, desc: 'En- or disable depth buffer write and masking.', def: 'False' },
		 { name: 'color', dt: core.datatypes.COLOR, desc: 'Diffuse color. Will modulate the texture color.', def: 'White' },
		 { name: 'blend mode', dt: core.datatypes.FLOAT, desc: 'Fragment blend mode.', def: 'Normal' },
		 { name: 'texture', dt: core.datatypes.TEXTURE, desc: 'Diffuse texture map.' }
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
			else if(slot.index === 4)
				self.tex = null;
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
					gl.uniform4fv(this.diffuseColorUniform, new Float32Array(self.color.rgba));
					
					if(this.uv0CoordAttribute !== undefined)
					{
						gl.enableVertexAttribArray(this.uv0CoordAttribute);
	
						if(self.tex !== null)
						{
							gl.uniform1i(this.tex0Uniform, 0);
							self.tex.enable(gl.TEXTURE0);
						}
						else if(mesh.material.diffuse_tex)
						{
							gl.uniform1i(this.tex0Uniform, 0);
							mesh.material.diffuse_tex.enable(gl.TEXTURE0);
						}
						else
						{
							gl.bindTexture(gl.TEXTURE_2D, null);
						}
					}
				
					var r = core.renderer;
		
					r.set_depth_enable(self.is3d);
					r.set_blend_mode(self.blend_mode);
				};
			}
		}
		else if(slot.index === 1)
			self.is3d = data;
		else if(slot.index === 2)
			self.color = data;
		else if(slot.index === 3)
			self.blend_mode = data;
		else if(slot.index === 4)
			self.tex = data;
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
			self.is3d = false;
			self.color = new Color(1.0, 1.0, 1.0, 1.0);
			self.blend_mode = Renderer.blend_mode.NORMAL;
			self.tex = null;
		}
	};
};
