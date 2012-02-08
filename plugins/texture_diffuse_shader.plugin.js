g_Plugins["texture_diffuse_shader"] = function(core) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.input_slots = [
		 { name: 'color', dt: core.datatypes.COLOR },
		 { name: 'texture', dt: core.datatypes.TEXTURE },
		 { name: 'camera', dt: core.datatypes.CAMERA },
		 { name: 'transform', dt: core.datatypes.MATRIX }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER } 
	];
	
	var vs_src = '\
		attribute vec3 pos;\n\
		attribute vec2 uv;\n\
		\n\
		varying vec2 uv_coord;\n\
		\n\
		uniform mat4 m_mat;\n\
		uniform mat4 v_mat;\n\
		uniform mat4 p_mat;\n\
		\n\
		void main(void) {\n\
			gl_Position = p_mat * m_mat * v_mat * vec4(pos, 1.0);\n\
			uv_coord = uv;\n\
		}';
		
	var ps_src = '\
		precision mediump float;\n\
		\n\
		varying vec2 uv_coord;\n\
		\n\
    		uniform sampler2D tex0;\n\
    		uniform vec4 color;\n\
		\n\
		void main(void) {\n\
			gl_FragColor = vec4(color.rgb * texture2D(tex0, uv_coord.st).rgb, 1.0);\n\
		}';

	this.s = new ShaderProgram(gl);
	this.vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
	this.ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);
	
	var prog = this.s.program;
	
	this.s.attach(this.vs);
	this.s.attach(this.ps);
	this.s.link();
	
	this.s.vertexPosAttribute = gl.getAttribLocation(prog, "pos");
	this.s.uvCoordAttribute = gl.getAttribLocation(prog, "uv");
	this.s.mMatUniform = gl.getUniformLocation(prog, "m_mat");
	this.s.vMatUniform = gl.getUniformLocation(prog, "v_mat");
	this.s.pMatUniform = gl.getUniformLocation(prog, "p_mat");
	this.s.colorUniform = gl.getUniformLocation(prog, "color");
	this.s.tex0Uniform = gl.getUniformLocation(prog, "tex0");
	
	// Note: Shader implementations must decorate the shader prototype with these
	// two methods, so the rendering plugins can call it to update the shader uniforms
	// / bind vertex data at the appropriate point in its rendering logic. It also
	// means that the rendering logic is kept independent of the renderer logic:
	// if an array type in unknown by the shader, but requested by the renderer,
	// the request can be silently droppred, which gives us a nice weak API.

	this.s.bind_array = function(type, data, item_size)
	{
		var types = core.renderer.array_type;
		
		if(type === types.VERTEX)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.vertexAttribPointer(self.s.vertexPosAttribute, item_size, gl.FLOAT, false, 0, 0);
		}
		else if(type === types.UV0)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.vertexAttribPointer(self.s.uvCoordAttribute, item_size, gl.FLOAT, false, 0, 0);
		}
	}

	this.s.apply_uniforms = this.apply_uniforms = function()
	{
		gl.uniformMatrix4fv(self.s.mMatUniform, false, self.transform);
		gl.uniformMatrix4fv(self.s.vMatUniform, false, self.camera.view);
		gl.uniformMatrix4fv(self.s.pMatUniform, false, self.camera.projection);
		gl.uniform4fv(self.s.colorUniform, new Float32Array(self.color.rgba));
		gl.enableVertexAttribArray(self.s.vertexPosAttribute);
		gl.enableVertexAttribArray(self.s.uvCoordAttribute);
		
		if(self.tex !== null)
		{
			gl.uniform1i(self.s.tex0Uniform, 0);
			self.tex.enable(gl.TEXTURE0);
		}
	};
	
	this.reset = function(ui)
	{
		self.color = new Color(1.0, 1.0, 1.0, 1.0);
		self.tex = null;
		self.camera = new Camera();
		self.transform = mat4.create();
	
		mat4.identity(self.transform);
	};
	
	this.disconnect_input = function(index)
	{
		if(index === 1)
			self.tex = null;
	};
	
	this.update_input = function(index, data)
	{
		if(index === 0)
			self.color = data;
		else if(index === 1)
			self.tex = data;
		else if(index === 2)
			self.camera = data;
		else if(index === 3)
			self.transform = data;
	};
	
	this.update_output = function(index)
	{
		return self.s;
	};
};
