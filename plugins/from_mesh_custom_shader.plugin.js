E2.plugins["from_mesh_custom_shader"] = function(core, node) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.desc = 'Auto-generate a shader embedding user-defined main bodies tailored to correctly and optimally render the supplied mesh.';
	this.input_slots = [
		 { name: 'mesh', dt: core.datatypes.MESH },
		 { name: 'is3d', dt: core.datatypes.BOOL, desc: 'Type: Bool<break>En- or disable depth buffer write and masking.' },
		 { name: 'color', dt: core.datatypes.COLOR, desc: 'Type: Color<break>Diffuse color. Will module the texture color.' },
		 { name: 'blend mode', dt: core.datatypes.FLOAT },
		 { name: 'texture', dt: core.datatypes.TEXTURE }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER } 
	];
	
	this.state = { 
		vs_src: 'void main(void)\n{\n\tvec4 dc = color;\n\tgl_Position = p_mat * v_mat * m_mat * vec4(v_pos, 1.0);\n\n\tf_col = dc;\n}',
		ps_src: 'void main(void)\n{\n\tgl_FragColor = f_col;\n}' 
	};

	this.shader = null;
	this.changed = true;
	
	this.reset = function()
	{
		// Retransmit the shader handle if we've been stopped.
		self.changed = true;
	};
	
	this.open_editor = function(src_id, title, done_func, dest) { return function(e)
	{
		var diag = make('span');
		var src = $('<textarea></textarea>'); 
		
		src.css('margin-top', '12px');
		src.css('border', '1px solid #888');
		src.css('width', '430px');
		src.css('height', '400px');
		src.css('resize', 'none');
		
		src.val(self.state[src_id]);
		
		diag.append(src);
		
		diag.dialog({
			width: 460,
			height: 150,
			modal: true,
			title: 'Edit ' + title + ' shader.',
			show: 'slide',
			hide: 'slide',
			buttons: {
				'OK': function()
				{
					dest(src.val());
					done_func(diag);
				},
				'Cancel': function()
				{
					$(this).dialog('close');
				}
			}
		});
	}};
	
	this.create_ui = function()
	{
		var layout = make('div');
		var inp_vs = $('<input id="vs_btn" type="button" value="Vertex" title="Click to edit source." />');
		var inp_ps = $('<input id="ps_btn" type="button" value="Pixel" title="Click to edit source." />');
		
		inp_vs.css('width', '55px');
		inp_ps.css('width', '55px');
		
		var done_func = function(diag)
		{
			self.rebuild_shader();
			self.changed = true;
			diag.dialog('close');
		};
		
		inp_vs.click(self.open_editor('vs_src', 'vertex', done_func, function(v) { self.state.vs_src = v; }));
		inp_ps.click(self.open_editor('ps_src', 'pixel', done_func, function(v) { self.state.ps_src = v; }));

		layout.append(inp_vs);
		layout.append(make('br'));
		layout.append(inp_ps);
		
		return layout;
	};

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
	
	this.rebuild_shader = function()
	{
		if(!self.mesh)
			return;

		self.shader = self.mesh.generate_shader(null, self.state.vs_src, self.state.ps_src);
	
		// Decorate with an apply_uniforms method that maps
		// our values to the generated shader.
		self.shader.apply_uniforms = function()
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
				else
				{
					gl.bindTexture(gl.TEXTURE_2D, null);
				}
			}
	
			var r = core.renderer;

			r.set_depth_enable(self.is3d);
			r.set_blend_mode(self.blend_mode);
		};
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
		{
			self.mesh = data;
			self.rebuild_shader();
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
	
	this.update_state = function(delta_t)
	{
		if(self.changed)
		{
			self.changed = false;
			self.updated = true;
		}
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
		}
	};
};
