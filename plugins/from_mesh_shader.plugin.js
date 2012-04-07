E2.plugins["from_mesh_shader"] = function(core, node) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.input_slots = [
		 { name: 'mesh', dt: core.datatypes.MESH },
		 { name: 'is3d', dt: core.datatypes.BOOL },
		 { name: 'color', dt: core.datatypes.COLOR },
		 { name: 'blend mode', dt: core.datatypes.FLOAT },
		 { name: 'texture', dt: core.datatypes.TEXTURE },
		 { name: 'camera', dt: core.datatypes.CAMERA },
		 { name: 'transform', dt: core.datatypes.TRANSFORM }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER } 
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
				self.shader.apply_uniforms = function()
				{
					gl.uniformMatrix4fv(this.mMatUniform, false, self.transform);
					gl.uniformMatrix4fv(this.vMatUniform, false, self.camera.view);
					gl.uniformMatrix4fv(this.pMatUniform, false, self.camera.projection);
					gl.uniform4fv(this.diffuseColorUniform, new Float32Array(self.color.rgba));
					
					if(this.uv0CoordAttribute !== undefined)
					{
						gl.enableVertexAttribArray(this.uv0CoordAttribute);
	
						if(self.tex !== null)
						{
							gl.uniform1i(this.tex0Uniform, 0);
							self.tex.enable(gl.TEXTURE0);
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
		else if(slot.index === 5)
			self.camera = data;
		else
			self.transform = data;
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
			self.blend_mode = core.renderer.blend_mode.NORMAL;
			self.tex = null;
			self.camera = new Camera();
			self.transform = mat4.create();

			mat4.identity(self.transform);
		}
	};
};
