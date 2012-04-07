E2.plugins["texture_diffuse_shader"] = function(core, node) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.input_slots = [
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
	
	var vs_src = 'attribute vec3 pos;' +
		     'attribute vec2 uv;' +
		     'varying vec2 uv_coord;' +
		     'uniform mat4 m_mat;' +
		     'uniform mat4 v_mat;' +
		     'uniform mat4 p_mat;' +
		     'void main(void) { gl_Position = p_mat * v_mat * m_mat * vec4(pos, 1.0); uv_coord = uv; }';
		
	var ps_src = 'precision mediump float;' +
		     'varying vec2 uv_coord;' +
    		     'uniform sampler2D tex0;' +
    		     'uniform vec4 color;' +
		     'void main(void) { vec4 c = texture2D(tex0, uv_coord.st); gl_FragColor = vec4(color * c); }';

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
	// and bind vertex data at the appropriate point in its rendering logic. It also
	// means that the rendering logic is kept independent of the renderer logic:
	// if an array type in unknown by the shader, but requested by the renderer,
	// the request can be silently droppred, which gives us a nice weak API.

	this.s.bind_array = function(type, data, item_size)
	{
		var types = VertexBuffer.vertex_type;
		var attr = null;
		
		if(type === types.VERTEX)
			attr = this.vertexPosAttribute;
		else if(type === types.UV0)
			attr = this.uvCoordAttribute;
		else
			return;
			
		gl.bindBuffer(gl.ARRAY_BUFFER, data);
		gl.enableVertexAttribArray(attr);
		gl.vertexAttribPointer(attr, item_size, gl.FLOAT, false, 0, 0);
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
		else
		{
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		
		var r = core.renderer;
		
		r.set_depth_enable(self.is3d);
		r.set_blend_mode(self.blend_mode);
	};
	
	this.connection_changed = function(on, conn, slot)
	{
		if(!on && slot.type === E2.slot_type.input && slot.index === 3)
			self.tex = null;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.is3d = data;
		else if(slot.index === 1)
			self.color = data;
		else if(slot.index === 2)
			self.blend_mode = data;
		else if(slot.index === 3)
			self.tex = data;
		else if(slot.index === 4)
			self.camera = data;
		else
			self.transform = data;
	};
	
	this.update_output = function(slot)
	{
		return self.s;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
		{
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
