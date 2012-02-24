E2.plugins["flat_shader"] = function(core) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.input_slots = [
		 { name: 'color', dt: core.datatypes.COLOR },
		 { name: 'camera', dt: core.datatypes.CAMERA },
		 { name: 'transform', dt: core.datatypes.MATRIX }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER } 
	];
	
	var vs_src = 'attribute vec3 pos;' +
		     'uniform mat4 m_mat;' +
		     'uniform mat4 v_mat;' +
		     'uniform mat4 p_mat;' +
		     'void main(void) { gl_Position = p_mat * m_mat * v_mat * vec4(pos, 1.0); }';
	
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
      		var t = core.renderer.array_type;
      		
      		if(type === t.VERTEX)
      		{
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.vertexAttribPointer(self.s.vertexPosAttribute, item_size, gl.FLOAT, false, 0, 0);
      		}
      	}
      	
      	this.s.apply_uniforms = this.apply_uniforms = function()
      	{
		gl.uniformMatrix4fv(self.s.mMatUniform, false, self.transform);
		gl.uniformMatrix4fv(self.s.vMatUniform, false, self.camera.view);
		gl.uniformMatrix4fv(self.s.pMatUniform, false, self.camera.projection);
		gl.uniform4fv(self.s.colorUniform, new Float32Array(self.color.rgba));
		gl.enableVertexAttribArray(self.s.vertexPosAttribute);
      	};
      	
	this.reset = function()
	{
		self.color = new Color(1.0, 1.0, 1.0, 1.0);
		self.camera = new Camera(gl);
		self.transform = mat4.create();
	
		mat4.identity(this.transform);
	}
	
	this.update_input = function(index, data)
	{
		if(index === 0)
			self.color = data;
		else if(index === 1)
			self.camera = data;
		else if(index === 2)
			self.transform = data;
	};
	
	this.update_output = function(index)
	{
		return self.s;
	};
};
