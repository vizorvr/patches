E2.plugins["flat_shader"] = function(core, node) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.desc = 'Simple shader for rendering meshes with diffuse color only.';
	this.input_slots = [
		 { name: 'is3d', dt: core.datatypes.BOOL },
		 { name: 'color', dt: core.datatypes.COLOR },
		 { name: 'blend mode', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER } 
	];
	
	var vs_src = 'attribute vec3 pos;' +
		     'uniform mat4 m_mat;' +
		     'uniform mat4 v_mat;' +
		     'uniform mat4 p_mat;' +
		     'void main(void) { gl_Position = p_mat * v_mat * m_mat * vec4(pos, 1.0); }';
	
	var ps_src = 'precision mediump float;' +
		     'uniform vec4 color;' +
		     'void main(void) { gl_FragColor = color; }';

	this.s = new ShaderProgram(gl);
	this.vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
	this.ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);

	var prog = this.s.program;

	this.s.attach(this.vs);
	this.s.attach(this.ps);
	this.s.link();

	this.s.vertexPosAttribute = gl.getAttribLocation(prog, "pos");
	this.s.mMatUniform = gl.getUniformLocation(prog, "m_mat");
	this.s.vMatUniform = gl.getUniformLocation(prog, "v_mat");
	this.s.pMatUniform = gl.getUniformLocation(prog, "p_mat");
	this.s.colorUniform = gl.getUniformLocation(prog, "color");

      	this.s.bind_array = function(type, data, item_size)
      	{
      		if(type === VertexBuffer.vertex_type.VERTEX)
      		{
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.vertexAttribPointer(self.s.vertexPosAttribute, item_size, gl.FLOAT, false, 0, 0);
      		}
      	}
      	
      	this.s.apply_uniforms = this.apply_uniforms = function()
      	{
		gl.uniform4fv(self.s.colorUniform, new Float32Array(self.color.rgba));
		gl.enableVertexAttribArray(self.s.vertexPosAttribute);
		
		var r = core.renderer;
		
		r.set_depth_enable(self.is3d);
		r.set_blend_mode(self.blend_mode);
      	};
      	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.is3d = data;
		else if(slot.index === 1)
			self.color = data;
		else if(slot.index === 2)
			self.blend_mode = data;
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
		}
	};

      	this.state_changed(null);
};
