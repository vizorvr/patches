E2.plugins["normal_as_color_shader"] = function(core, node) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.desc = 'Render interpolated normals as RGB colors.';
	this.input_slots = [
		 { name: 'is3d', dt: core.datatypes.BOOL, desc: 'En- or disable depth buffer write and masking.', def: 'False' }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	];
	
	var vs_src = 'attribute vec3 pos;'  +
		     'attribute vec3 norm;' +
		     'uniform mat4 m_mat;'  +
		     'uniform mat4 v_mat;'  +
		     'uniform mat4 p_mat;'  +
		     'varying lowp vec3 color;' +
		     'void main(void) { gl_Position = p_mat * v_mat * m_mat * vec4(pos, 1.0); color = norm; }';
	
	var ps_src = 'precision mediump float;' +
		     'varying lowp vec3 color;' +
		     'void main(void) { gl_FragColor = vec4(color, 1.0); }';

	this.s = new ShaderProgram(gl);
	this.vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
	this.ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);

	var prog = this.s.program;

	this.s.attach(this.vs);
	this.s.attach(this.ps);
	this.s.link();

	this.s.vertexPosAttribute = gl.getAttribLocation(prog, "pos");
	this.s.vertexNormAttribute = gl.getAttribLocation(prog, "norm");
	this.s.mMatUniform = gl.getUniformLocation(prog, "m_mat");
	this.s.vMatUniform = gl.getUniformLocation(prog, "v_mat");
	this.s.pMatUniform = gl.getUniformLocation(prog, "p_mat");

      	this.s.bind_array = function(type, data, item_size)
      	{
      		var t = VertexBuffer.vertex_type;
      		
      		if(type === t.VERTEX)
      		{
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.vertexAttribPointer(self.s.vertexPosAttribute, item_size, gl.FLOAT, false, 0, 0);
      		}
      		else if(type === t.NORMAL)
      		{
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.vertexAttribPointer(self.s.vertexNormAttribute, item_size, gl.FLOAT, false, 0, 0);
      		}
      	}
      	
      	this.s.apply_uniforms = this.apply_uniforms = function(mesh)
      	{
		gl.enableVertexAttribArray(self.s.vertexPosAttribute);
		gl.enableVertexAttribArray(self.s.vertexNormAttribute);
		
		var r = core.renderer;
		
		r.set_depth_enable(self.is3d);
		r.set_blend_mode(Renderer.blend_mode.NORMAL);
      	};
      	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.is3d = data;
	};
	
	this.update_output = function(slot)
	{
		return self.s;
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
			self.is3d = false;
	};

      	this.state_changed(null);
};
