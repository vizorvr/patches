E2.p = E2.plugins["normal_as_color_shader"] = function(core, node)
{
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.desc = 'Render vertex normals as interpolated RGB colors.';
	this.input_slots = [];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	];
	
	var vs_src = 'attribute vec3 v_pos;'  +
		     'attribute vec3 v_norm;' +
		     'uniform mat4 m_mat;'  +
		     'uniform mat4 v_mat;'  +
		     'uniform mat4 p_mat;'  +
		     'varying lowp vec3 f_col;' +
		     'void main(void) { gl_Position = p_mat * v_mat * m_mat * vec4(v_pos, 1.0); f_col = (v_norm * 0.5) + vec3(0.5, 0.5, 0.5); }';
	
	var ps_src = 'precision mediump float;' +
		     'varying lowp vec3 f_col;' +
		     'void main(void) { gl_FragColor = vec4(f_col, 1.0); }';

	var s = this.s = new ShaderProgram(gl);
	this.vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
	this.ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);

	var prog = s.program;

	s.attach(this.vs);
	s.attach(this.ps);
	s.link();

	s.v_pos = gl.getAttribLocation(prog, "v_pos");
	s.v_norm = gl.getAttribLocation(prog, "v_norm");
	s.m_mat = gl.getUniformLocation(prog, "m_mat");
	s.v_mat = gl.getUniformLocation(prog, "v_mat");
	s.p_mat = gl.getUniformLocation(prog, "p_mat");

      	s.bind_array = function(s, gl) { return function(type, data, item_size)
      	{
      		var t = VertexBuffer.vertex_type;
      		
		gl.bindBuffer(gl.ARRAY_BUFFER, data);
		
      		if(type === t.VERTEX)
			gl.vertexAttribPointer(s.v_pos, item_size, gl.FLOAT, false, 0, 0);
      		else if(type === t.NORMAL)
			gl.vertexAttribPointer(s.v_norm, item_size, gl.FLOAT, false, 0, 0);
      	}}(s, gl);
      	
      	s.apply_uniforms = function(s, gl, r) { return function(mesh)
      	{
		gl.enableVertexAttribArray(s.v_pos);
		gl.enableVertexAttribArray(s.v_norm);
		r.set_depth_enable(true);
		r.set_blend_mode(Renderer.blend_mode.NORMAL);
      	}}(s, gl, core.renderer);
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.update_output = function(slot)
{
	return this.s;
};


