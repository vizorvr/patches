E2.p = E2.plugins["flat_shader"] = function(core, node)
{
	this.desc = 'Simple shader for rendering meshes with diffuse color only.';
	
	this.input_slots = [
		 { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The surface material.' }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	];

	var gl = core.renderer.context;
	
	var vs_src = 'attribute vec3 v_pos;' +
		     'uniform mat4 m_mat;' +
		     'uniform mat4 v_mat;' +
		     'uniform mat4 p_mat;' +
		     'void main(void) { gl_Position = p_mat * v_mat * m_mat * vec4(v_pos, 1.0); }';

	var ps_src = 'precision mediump float;' +
		     'uniform vec4 d_col;' +
		     'void main(void) { gl_FragColor = d_col; }';

	this.s = new ShaderProgram(gl);
	this.vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
	this.ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);

	var prog = this.s.program;

	this.s.attach(this.vs);
	this.s.attach(this.ps);
	this.s.link();

	this.s.v_pos = gl.getAttribLocation(prog, "v_pos");
	this.s.m_mat = gl.getUniformLocation(prog, "m_mat");
	this.s.v_mat = gl.getUniformLocation(prog, "v_mat");
	this.s.p_mat = gl.getUniformLocation(prog, "p_mat");
	this.s.d_col = gl.getUniformLocation(prog, "d_col");

      	this.s.bind_array = function(self, gl) { return function(type, data, item_size)
      	{
      		if(type !== VertexBuffer.vertex_type.VERTEX)
      			return;
      		
		gl.bindBuffer(gl.ARRAY_BUFFER, data);
		gl.vertexAttribPointer(self.s.v_pos, item_size, gl.FLOAT, false, 0, 0);
      	}}(this, gl);
      	
      	this.s.apply_uniforms = this.apply_uniforms = function(self, gl) { return function(mesh)
      	{
		var mat = self.material ? self.material : mesh.material;
		
		gl.uniform4fv(self.s.d_col, mat.diffuse_color ? new Float32Array(mat.diffuse_color.rgba) : this.s);
		gl.enableVertexAttribArray(self.s.v_pos);
		
		mat.enable();
      	}}(this, gl);

      	this.state_changed(null);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.material = data;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && slot.type === E2.slot_type.input)
		this.material = null;
};

E2.p.prototype.update_output = function(slot)
{
	return this.s;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
		this.material = null;
};
