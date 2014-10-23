E2.p = E2.plugins["texture_diffuse_shader"] = function(core, node)
{
	this.desc = 'Simple shader for rendering meshes with one texture modulated by a diffuse color.';
	
	this.input_slots = [
		 { name: 'material', dt: core.datatypes.MATERIAL, desc: 'The surface material.', def: null },
		 { name: 'uv offset', dt: core.datatypes.VECTOR, desc: 'UV translation. Only the x and y components are used with the z axis disregarded.', def: [0.0, 0.0] },
		 { name: 'uv scale', dt: core.datatypes.VECTOR, desc: 'UV scale. Only the x and y components are used with the z axis factor disregarded.', def: [1.0, 1.0] },
		 { name: 'uv rotation', dt: core.datatypes.FLOAT, desc: 'UV rotation in degrees.', def: 0.0 },
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER, desc: 'The resulting shader.' } 
	];

	var vs_src = 'attribute vec3 v_pos;' +
		     'attribute vec2 v_uv0;' +
		     'varying vec2 f_uv0;' +
		     'uniform mat4 m_mat;' +
		     'uniform mat4 v_mat;' +
		     'uniform mat4 p_mat;' +
		     'uniform vec2 uv_offset;' +
		     'uniform vec2 uv_scale;' +
		     'uniform float uv_rotation;' +
		     'void main(void) {' +
		     '    gl_Position = p_mat * v_mat * m_mat * vec4(v_pos, 1.0);' + 
		     '    float cs = cos(uv_rotation);' +
		     '    float sn = sin(uv_rotation);' +
		     '    f_uv0 = vec2((((v_uv0.x * cs) - (v_uv0.y * sn)) * uv_scale.x) + uv_offset.x, (((v_uv0.x * sn) + (v_uv0.y * cs)) * uv_scale.y) + uv_offset.y);' +
		     '}';
		
	var ps_src = 'precision mediump float;' +
		     'varying vec2 f_uv0;' +
    		     'uniform sampler2D tex0;' +
    		     'uniform vec4 a_col;' +
    		     'uniform vec4 d_col;' +
    		     'uniform int e2_alpha_clip;' +
		     'void main(void) { vec4 c = texture2D(tex0, f_uv0.st); c *= d_col; c.rgb += a_col.rgb; if(e2_alpha_clip > 0 && c.a < 0.5) discard; gl_FragColor = vec4(c); }';

	var gl = this.gl = core.renderer.context;
	
	this.def_ambient = vec4.createFrom(0, 0, 0, 1);
	this.def_diffuse = vec4.createFrom(1, 1, 1, 1);
	
	this.s = new ShaderProgram(gl);
	this.vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
	this.ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);
	
	var prog = this.s.program;
	
	this.s.attach(this.vs);
	this.s.attach(this.ps);
	this.s.link();
	
	this.s.v_pos = gl.getAttribLocation(prog, "v_pos");
	this.s.v_uv0 = gl.getAttribLocation(prog, "v_uv0");
	this.s.m_mat = gl.getUniformLocation(prog, "m_mat");
	this.s.v_mat = gl.getUniformLocation(prog, "v_mat");
	this.s.p_mat = gl.getUniformLocation(prog, "p_mat");
	this.s.a_col = gl.getUniformLocation(prog, "a_col");
	this.s.d_col = gl.getUniformLocation(prog, "d_col");
	this.s.tex0 = gl.getUniformLocation(prog, "tex0");
	this.s.uv_offset = gl.getUniformLocation(prog, "uv_offset");
	this.s.uv_scale = gl.getUniformLocation(prog, "uv_scale");
	this.s.uv_rotation = gl.getUniformLocation(prog, "uv_rotation");
	this.s.e2_alpha_clip = gl.getUniformLocation(prog, "e2_alpha_clip");
	
	// Note: Shader implementations must decorate the shader prototype with these
	// two methods, so the rendering plugins can call it to update the shader uniforms
	// and bind vertex data at the appropriate point in its rendering logic. It also
	// means that the rendering logic is kept independent of the renderer logic:
	// if an array type in unknown by the shader, but requested by the renderer,
	// the request can be silently droppred, which gives us a nice weak API.

	this.s.bind_array = function(s, gl) { return function(type, data, item_size)
	{
		var types = VertexBuffer.vertex_type;
		var attr = null;
		
		if(type === types.VERTEX)
			attr = this.v_pos;
		else if(type === types.UV0)
			attr = this.v_uv0;
		else
			return;
			
		gl.bindBuffer(gl.ARRAY_BUFFER, data);
		gl.enableVertexAttribArray(attr);
		gl.vertexAttribPointer(attr, item_size, gl.FLOAT, false, 0, 0);
	}}(this.s, gl);

	this.s.apply_uniforms = function(self, gl) { return function(mesh)
	{
		var mat = self.material ? self.material : mesh.material;
		
		gl.uniform4fv(self.s.a_col, mat.ambient_color ? mat.ambient_color : this.def_ambient);
		gl.uniform4fv(self.s.d_col, mat.diffuse_color ? mat.diffuse_color : this.def_diffuse);
		gl.enableVertexAttribArray(self.s.v_pos);
		gl.enableVertexAttribArray(self.s.v_uv0);
		
		gl.uniform2fv(self.s.uv_offset, self.uv_offset);	
		gl.uniform2fv(self.s.uv_scale, self.uv_scale);	
		gl.uniform1f(self.s.uv_rotation, self.uv_rotation);
		gl.uniform1i(self.s.e2_alpha_clip, mat.alpha_clip ? 1 : 0);

		var diffuse_set = false;
		
		if(self.material)
		{
			var dt = self.material.textures[Material.texture_type.DIFFUSE_COLOR];
			
			if(dt)
			{
				gl.uniform1i(self.s.tex0Uniform, 0);
				dt.enable(gl.TEXTURE0);
				diffuse_set = true;
			}
		}
		
		if(!diffuse_set)
		{
			var dt = mesh.material.textures[Material.texture_type.DIFFUSE_COLOR];
			
			if(dt)
			{
				gl.uniform1i(this.tex0Uniform, 0);
				dt.enable(gl.TEXTURE0);
			}
			else
			{
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
		}
		
		mat.enable();
	}}(this, gl);
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.material = data;
	else if(slot.index === 1)
		this.uv_offset = vec2.createFrom(data[0], data[1]);
	else if(slot.index === 2)
		this.uv_scale = vec2.createFrom(data[0], data[1]);
	else if(slot.index === 3)
		this.uv_rotation = ((data % 360.0) / 180.0) * Math.PI;
};

E2.p.prototype.update_output = function(slot)
{
	return this.s;
};

E2.p.prototype.state_changed = function(ui)
{
	if(!ui)
	{
		this.material = null;
		this.uv_offset = vec2.createFrom(0, 0);
		this.uv_scale = vec2.createFrom(1, 1);
		this.uv_rotation = 0.0;
	}
};
