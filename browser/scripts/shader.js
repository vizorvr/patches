
function ComposeShader(cache, mesh, material, uniforms_vs, uniforms_ps, vs_custom, ps_custom, vcb, pcb, environment)
{
	var gl = E2.app.player.core.renderer.context;
	var streams = [];
	var v_types = VertexBuffer.vertex_type;
	var has_lights = false;
	var lights = material ? material.lights : mesh.material.lights;
	var tt = Material.texture_type;
    var has_fog = environment ? environment.fog.enabled : false; // fog.color, fog.distance, fog.steepness

	for(var v_type in v_types)
	{
		var index = v_types[v_type];
		
		streams[index] = mesh.vertex_buffers[v_type] !== null;
	}		
	
	var cached = [null, ''], shader = null;
	
	if(cache)
	{
		var caps = Material.get_caps_hash(mesh, material);
		
		if(uniforms_vs || uniforms_ps || vs_custom || ps_custom) // TODO: Stupid. Use a proper hash of the combined text.
			caps += '_' + Math.floor(Math.random() * 128000);

		cached = [cache.get(caps), caps];
	}

	if(!cached[0])
	{
		var prog = gl.createProgram();

		shader = new ShaderProgram(gl, prog);
		shader.apply_uniforms_custom = null;
		shader.streams = streams;
		shader.material = material;
		
		var mat = material ? material : mesh.material;
		var d_tex = shader.get_all_params(material, mesh.material, tt.DIFFUSE_COLOR);
		var s_tex = shader.get_all_params(material, mesh.material, tt.SPECULAR_COLOR);
		var n_tex = shader.get_all_params(material, mesh.material, tt.NORMAL);
		var e_tex = shader.get_all_params(material, mesh.material, tt.EMISSION_COLOR);
		var vs_src = [];
		var ps_src = [];
		var vs_c_src = [];
		var ps_c_src = [];

		var vs_dp = function(s)
		{
			vs_src.push(s);
			vs_c_src.push(s);
		};
	
		var ps_dp = function(s)
		{
			ps_src.push(s);
			ps_c_src.push(s);
		};

		vs_src.push('precision lowp float;');
		vs_src.push('attribute vec3 v_pos;');

		if(streams[v_types.COLOR])
			vs_src.push('attribute vec4 v_col;');

		if(streams[v_types.NORMAL])
			vs_src.push('attribute vec3 v_norm;');

		if(streams[v_types.UV0])
			vs_src.push('attribute vec2 v_uv0;');

		vs_src.push('uniform vec4 d_col;');
		vs_src.push('uniform mat4 m_mat;');
		vs_src.push('uniform mat4 v_mat;');
		vs_src.push('uniform mat4 p_mat;');
		vs_src.push('varying vec4 f_col;');
		
		if(uniforms_vs)
			vs_src = vs_src.concat(uniforms_vs);
	
		ps_src.push('precision lowp float;');
		ps_src.push('uniform vec4 a_col;');
		ps_src.push('varying vec4 f_col;');
		
		if(has_fog)
		{
			ps_src.push('uniform vec4 fog_col;'); 
			ps_src.push('uniform vec3 fog_attr;');
		}

		if (uniforms_ps)
			ps_src = ps_src.concat(uniforms_ps);
	
		if(streams[v_types.NORMAL])
		{
			vs_src.push('uniform mat3 n_mat;');
			vs_src.push('varying vec3 f_norm;');
		
			ps_src.push('varying vec3 f_norm;');
		
			for(var i = 0; i < 8; i++)
			{
				var l = lights[i];
			
				if(l)
				{
					var lid = 'l' + i;
				
					vs_src.push('uniform vec3 ' + lid + '_pos;');
					ps_src.push('uniform vec3 ' + lid + '_pos;');
					ps_src.push('uniform vec4 ' + lid + '_d_col;');
					ps_src.push('uniform vec4 ' + lid + '_s_col;');
					ps_src.push('uniform float ' + lid + '_power;');
					vs_src.push('varying vec3 ' + lid + '_v2l;');
					ps_src.push('varying vec3 ' + lid + '_v2l;');
					
					if(l.type === Light.type.DIRECTIONAL)
					{
						vs_src.push('uniform vec3 ' + lid + '_dir;');
						ps_src.push('uniform vec3 ' + lid + '_dir;');
					}
					
					has_lights = true;
				}
			}
		
			if(has_lights)
			{
				vs_src.push('varying vec3 eye_pos;');
				ps_src.push('uniform mat4 v_mat;');
				ps_src.push('varying vec3 eye_pos;');
				ps_src.push('uniform vec4 s_col;');
				ps_src.push('uniform float shinyness;');
			}
		}
	
		if(streams[v_types.UV0])
		{
			vs_src.push('varying vec2 f_uv0;');
			ps_src.push('varying vec2 f_uv0;');
			
			var push_tex_decl = function(tp, id)
			{
				if(!tp)
					return;
				
				ps_src.push('uniform sampler2D ' + id + '_tex;');
				vs_src.push('uniform sampler2D ' + id + '_tex;');
				
				if(tp[1])
					ps_src.push('uniform vec2 ' + id + '_ofs;');

				if(tp[2])
					ps_src.push('uniform vec2 ' + id + '_scl;');
			};
			
			push_tex_decl(d_tex, 'd');
			push_tex_decl(s_tex, 's');
			push_tex_decl(n_tex, 'n');
			push_tex_decl(e_tex, 'e');
		}

		var get_coords = function(uv_idx, type, tex)
		{
			var c = 'f_uv' + uv_idx;
		
			if(tex[2])
				c = '(' + c + ' * ' + type + '_scl)';
		
			if(tex[1])
				c += ' + ' + type + '_ofs';
		
			return c;
		};

		if(!vs_custom)
		{
			vs_dp('void main(void) {');
			vs_dp('    vec4 tp = m_mat * vec4(v_pos, 1.0);\n');

			vs_dp('    gl_Position = p_mat * v_mat * tp;');

			if(has_lights)
			{
				for(var i = 0; i < 8; i++)
				{
					var l = lights[i];
			
					if(l)
					{
						var lid = 'l' + i;
						
						if(l.type === Light.type.DIRECTIONAL)
							vs_dp('    ' + lid + '_v2l = ' + lid + '_dir;');
						else
							vs_dp('    ' + lid + '_v2l = ' + lid + '_pos - tp.xyz;');
					}
				}
				
				vs_dp('    eye_pos = normalize(tp.xyz);');
			}
			
			if(streams[v_types.COLOR])
				vs_dp('    f_col = d_col * v_col;');
			else
				vs_dp('    f_col = d_col;');
			
			if(streams[v_types.NORMAL])
				vs_dp('    f_norm = normalize(n_mat * v_norm);');
			
			if(streams[v_types.UV0])
				vs_dp('    f_uv0 = v_uv0;');		

			vs_dp('}');
		}
		else
		{
			vs_dp(vs_custom);
		}
	
		if(!ps_custom)
		{
			ps_dp('void main(void) {');

			if(!has_lights)
				ps_dp('    vec4 fc = f_col;');
			else
				ps_dp('    vec4 fc = vec4(0.0, 0.0, 0.0, f_col.a);');

			if(streams[v_types.NORMAL] && has_lights)
			{
				if(streams[v_types.UV0] && n_tex)
					ps_dp('    vec3 n_dir = normalize(f_norm * -(texture2D(n_tex, ' + get_coords(0, 'n', n_tex) + ').rgb - 0.5 * 2.0));');
				else
					ps_dp('    vec3 n_dir = normalize(f_norm);');

				for(var i = 0; i < 8; i++)
				{
					var l = lights[i];
			
					if(l)
					{
						var lid = 'l' + i;
						var liddir = lid + '_v2l_n';
				
						ps_dp('    vec3 ' + liddir + ' = normalize(' + lid + '_v2l);');
						ps_dp('    float ' + lid + '_dd = max(0.0, dot(n_dir, ' + liddir + '));');
						ps_dp('    float ' + lid + '_spec_fac = pow(max(0.0, dot(reflect(-' + liddir + ', n_dir), eye_pos)), shinyness + 1.0);');
						ps_dp('\n    fc.rgb += ' + lid + '_d_col.rgb * ' + lid + '_dd * ' + lid + '_power;');
						
						var s = '    fc.rgb += shinyness * ' + lid + '_power * ';
				
						s += lid + '_s_col.rgb * s_col.rgb * ' + lid + '_spec_fac';
						
						if(streams[v_types.UV0] && s_tex)
							s += ' * texture2D(s_tex, ' + get_coords(0, 's', s_tex) + ').rgb';
						
						ps_dp(s + ';\n');
					}
				}
			}
			
			if(has_lights)
				ps_dp('    fc.rgb *= f_col.rgb;');
			
			if(streams[v_types.UV0])
			{
				if(d_tex)
					ps_dp('    fc *= texture2D(d_tex, ' + get_coords(0, 'd', d_tex) + ');');
				
				if(e_tex)
				{
					ps_dp('    vec4 ec = texture2D(e_tex, ' + get_coords(0, 'e', e_tex) + ');');
					ps_dp('    fc.rgb += ec.rgb * ec.a;');
				}
			}

			ps_dp('    fc.rgb += a_col.rgb;\n');
			
			if(mat.alpha_clip)
				ps_dp('    if(fc.a < 0.5)\n        discard;\n');
	

			if(has_fog)
			{
				ps_dp('    float d = pow(clamp((gl_FragCoord.z / gl_FragCoord.w) / fog_attr.x, 0.0, 1.0), fog_attr.y);\n');
				ps_dp('    fc.rgb = mix(fc.rgb, fog_col.rgb, d);\n');
				//ps_dp('    fc.g = 1.0;\n');
				//ps_dp('    fc.a = 1.0;\n');
			}
			
			ps_dp('    gl_FragColor = fc;');
			ps_dp('}');
		}
		else
		{
			ps_dp(ps_custom);
		}

		shader.vs_src = vs_src.join('\n');
		shader.ps_src = ps_src.join('\n');
		shader.vs_c_src = vs_c_src.join('\n');
		shader.ps_c_src = ps_c_src.join('\n');
	   
		var vs = new Shader(gl, gl.VERTEX_SHADER, shader.vs_src, vs_src.length, vcb);
		var ps = new Shader(gl, gl.FRAGMENT_SHADER, shader.ps_src, ps_src.length, pcb);
		var compiled = vs.compiled && ps.compiled;

		var resolve_attr = function(id)
		{
			var idx = gl.getAttribLocation(prog, id);
			
			return idx < 0 ? undefined : idx;
		};
		
		var resolve_unif = function(id)
		{
			var loc = gl.getUniformLocation(prog, id);
			
			return loc;
		};
		
		if(compiled)
		{
			shader.attach(vs);
			shader.attach(ps);
			shader.link();
			
			if(streams[v_types.VERTEX])
				shader.v_pos = resolve_attr('v_pos');
		
			if(streams[v_types.NORMAL])
				shader.v_norm = resolve_attr('v_norm');
		
			shader.m_mat = resolve_unif('m_mat');
			shader.v_mat = resolve_unif('v_mat');
			shader.p_mat = resolve_unif('p_mat');
			shader.a_col = resolve_unif('a_col');
			shader.d_col = resolve_unif('d_col');

			if(has_lights)
			{
				shader.s_col = resolve_unif('s_col');
				shader.shinyness = resolve_unif('shinyness');
				shader.n_mat = resolve_unif('n_mat');
	
				for(var i = 0; i < 8; i++)
				{
					var l = lights[i];
			
					if(l)
					{
						var lid = 'l' + i;

						shader[lid + '_pos'] = resolve_unif(lid + '_pos');
						shader[lid + '_d_col'] = resolve_unif(lid + '_d_col');
						shader[lid + '_s_col'] = resolve_unif(lid + '_s_col');
						shader[lid + '_power'] = resolve_unif(lid + '_power');
				
						if(l.type === Light.type.DIRECTIONAL)
							shader[lid + '_dir'] = resolve_unif(lid + '_dir');
					}
				}
			}

			if(has_fog)
			{
				shader.fog_col = resolve_unif('fog_col');
				shader.fog_attr = resolve_unif('fog_attr');
				shader.fog = environment.fog;
			}

			if(streams[v_types.COLOR])
				shader.v_col = resolve_attr('v_col');
		
			if(streams[v_types.UV0])
			{
				shader.v_uv0 = resolve_attr('v_uv0');
			
				var get_tex_uniforms = function(shader, type, tex)
				{
					if(!tex)
						return;
						
					shader[type + '_tex'] = resolve_unif(type + '_tex');
					
					if(tex[1])
						shader[type + '_ofs'] = resolve_unif(type + '_ofs');

					if(tex[2])
						shader[type + '_scl'] = resolve_unif(type + '_scl');
				};
				
				get_tex_uniforms(shader, 'd', d_tex);
				get_tex_uniforms(shader, 's', s_tex);
				get_tex_uniforms(shader, 'n', n_tex);
				get_tex_uniforms(shader, 'e', e_tex);
			}
		}
	
		shader.bind_array = function(type, data, item_size)
		{
			var types = VertexBuffer.vertex_type;
			var attr = undefined;
		
			if(type === types.VERTEX)
				attr = this.v_pos;
			else if(type === types.UV0)
				attr = this.v_uv0;
			else if(type === types.NORMAL)
				attr = this.v_norm;
			else if(type === types.COLOR)
				attr = this.v_col;
		
			if(attr === undefined)
				return;
		
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.enableVertexAttribArray(attr);
			gl.vertexAttribPointer(attr, item_size, gl.FLOAT, false, 0, 0);
		};
	
		shader.apply_uniforms = !compiled ? function(mesh, mat) {} : function(mesh, mat)
		{
			var r = E2.app.player.core.renderer;
			var m = mat ? mat : mesh.material;

			gl.enableVertexAttribArray(this.v_pos);
			gl.uniform4fv(this.a_col, (m.ambient_color) ? m.ambient_color : r.def_ambient);
			gl.uniform4fv(this.d_col, (m.diffuse_color) ? m.diffuse_color : r.def_diffuse);
		
			if(this.s_col !== undefined)
				gl.uniform4fv(this.s_col, (m.specular_color) ? m.specular_color : r.def_specular);
		
			if(this.shinyness !== undefined)
				gl.uniform1f(this.shinyness, m.shinyness);
	
			if(has_fog && this.fog_col !== undefined)
			{
				gl.uniform4fv(this.fog_col, this.fog.color);
			}

			if(has_fog && this.fog_attr !== undefined)
			{
				gl.uniform3f(this.fog_attr, this.fog.distance, this.fog.steepness, 0.0);
			}


			for(var i = 0; i < 8; i++)
			{
				var l = lights[i];
			
				if(l)
				{
					var lid = 'l' + i;

					gl.uniform3fv(this[lid + '_pos'], l.position);
					gl.uniform4fv(this[lid + '_d_col'], l.diffuse_color);
					gl.uniform4fv(this[lid + '_s_col'], l.specular_color);
					gl.uniform1f(this[lid + '_power'], l.intensity);
				
					if(l.type === Light.type.DIRECTIONAL)
						gl.uniform3fv(this[lid + '_dir'], l.direction);
				}
			}

			if(this.v_norm !== undefined)
				gl.enableVertexAttribArray(this.v_norm);
		
			if(this.v_uv0 !== undefined)
			{
				var mm = mesh.material;
				var dt = this.get_all_params(mat, mm, tt.DIFFUSE_COLOR),
				    st = this.get_all_params(mat, mm, tt.SPECULAR_COLOR),
				    nt = this.get_all_params(mat, mm, tt.NORMAL),
				    et = this.get_all_params(mat, mm, tt.EMISSION_COLOR);
				var disable_tex = function(stage)
				{
					gl.activeTexture(stage);
					gl.bindTexture(gl.TEXTURE_2D, null);
				};
								
				gl.enableVertexAttribArray(this.v_uv0);

				if(dt && this.d_tex !== undefined)
					shader.bind_tex(this.d_tex, this.d_ofs, this.d_scl, 0, gl.TEXTURE0, dt, r.default_tex);
				else
					disable_tex(gl.TEXTURE0);
					
				if(st && this.s_tex !== undefined)
					shader.bind_tex(this.s_tex, this.s_ofs, this.s_scl, 1, gl.TEXTURE1, st, r.default_tex);
				else
					disable_tex(gl.TEXTURE1);

				if(nt && this.n_tex !== undefined)
					shader.bind_tex(this.n_tex, this.n_ofs, this.n_scl, 2, gl.TEXTURE2, nt, r.default_tex);
				else
					disable_tex(gl.TEXTURE2);

				if(et && this.e_tex !== undefined)
					shader.bind_tex(this.e_tex, this.e_ofs, this.e_scl, 3, gl.TEXTURE3, et, r.default_tex);
				else
					disable_tex(gl.TEXTURE3);
			}
		
			if(this.apply_uniforms_custom)
				this.apply_uniforms_custom();
		
			if(m.double_sided)
				gl.disable(gl.CULL_FACE);
			else
				gl.enable(gl.CULL_FACE);
	
			m.enable();
		};
		
		if(cache)
			cache.set_shader(cached[1], shader);
	}
	else
		shader = cached[0];
	
	return shader;
}

function ShaderCache(gl)
{
	this.shaders = {};
}

ShaderCache.prototype.get = function(key)
{
	if(key in this.shaders)
		return this.shaders[key];
	
	return null;
}

ShaderCache.prototype.count = function()
{
	var c = 0;
	
	for(p in this.shaders)
		++c;
		
	return c;
};

ShaderCache.prototype.set_shader = function(key, shader)
{
	this.shaders[key] = shader;
};

ShaderCache.prototype.clear = function()
{
	this.shaders = {};
};

function Shader(gl, type, src, lineOffset, cb) {
	this.shader = gl.createShader(type)
	this.compiled = false
	this.linked = false
	this.compile_info = ''
	this.link_info = ''
	cb = cb || function(){}

	try {
		gl.shaderSource(this.shader, src)
	} catch(e) {
		msg('ERROR: Shader source invalid: ' + e)
		return cb({
			row: 1,
			text: 'Shader source invalid: '+e
		})
	}

	gl.compileShader(this.shader)
	var compileStatus = gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)

	if (!compileStatus) {
		var info = gl.getShaderInfoLog(this.shader)
		var info_lines = info.split('\n')
		var src_lines = src.split('\n')
		
		this.compile_info = info
		msg('ERROR: Shader compilation failed:\n')
		
		var errors = []

		info_lines.forEach(function(line_str) {
			if (!line_str)
				return;

			var split = line_str.split(/ERROR\: \d+\:(\d+): (.*)/)

			var err = {
				row: parseInt(split[1], 10) - lineOffset,
				text: line_str,
				type: 'error'
			}

			msg(err.row + '\n\t>>> ' + src_lines[err.row])
			errors.push(err)
		})

		cb(errors)
	} else {
		this.compiled = true
		cb()
	}

}

function ShaderProgram(gl, program)
{
	this.gl = gl;
	this.program = program || gl.createProgram();
	this.n_mat = null;
}

ShaderProgram.prototype.attach = function(shader)
{
	this.gl.attachShader(this.program, shader.shader);
};

ShaderProgram.prototype.link = function()
{
	var gl = this.gl;
	var prog = this.program;
	
	gl.linkProgram(prog);
	this.linked = true;
	this.link_info = '';
	
	if(!gl.getProgramParameter(prog, gl.LINK_STATUS))
	{
		msg('ERROR: Shader linking failed:\n' + gl.getProgramInfoLog(prog));
		this.link_info += gl.getProgramInfoLog(prog);
		this.linked = false;
	}
	
	gl.validateProgram(prog);
	
	if(!gl.getProgramParameter(prog, gl.VALIDATE_STATUS))
	{
		msg('ERROR: Shader validation failed:\n' + gl.getProgramInfoLog(prog));
		this.link_info += gl.getProgramInfoLog(prog);
		this.linked = false;
	}
};

ShaderProgram.prototype.enable = function()
{
	this.gl.useProgram(this.program);
};

ShaderProgram.prototype.bind_camera = function(camera)
{
	var gl = this.gl;
	
	gl.uniformMatrix4fv(this.v_mat, false, camera.view);
	gl.uniformMatrix4fv(this.p_mat, false, camera.projection);
};

ShaderProgram.prototype.bind_transform = function(m_mat)
{
	var gl = this.gl;
	
	gl.uniformMatrix4fv(this.m_mat, false, m_mat);
	
	if(this.n_mat)
	{
		var n_mat = mat3.create();
		
		mat4.toInverseMat3(m_mat, n_mat);
		mat3.transpose(n_mat);
		gl.uniformMatrix3fv(this.n_mat, false, n_mat);
	}
};
	
ShaderProgram.prototype.get_tex_param = function(mat, mesh_mat, name, type)
{
	return (mat ? mat[name][type] : undefined) || (mesh_mat ? mesh_mat[name][type] : undefined);
};

ShaderProgram.prototype.get_all_params = function(mat, mesh_mat, type)
{
	var tex = this.get_tex_param(mat, mesh_mat, 'textures', type);
	
	if(!tex)
		return null;
	
	return [
		tex,
		this.get_tex_param(mat, mesh_mat, 'uv_offsets', type),
		this.get_tex_param(mat, mesh_mat, 'uv_scales', type)
	];
};
		
ShaderProgram.prototype.bind_tex = function(uni_t, uni_o, uni_s, tex_channel, tex_idx, tex, dt)
{
	var t = tex[0].complete ? tex[0] : dt;
	var gl = this.gl;
	
	gl.uniform1i(uni_t, tex_channel);
	
	if(tex[1]) // Offset?
		gl.uniform2f(uni_o, tex[1][0], tex[1][1]);
		
	if(tex[2]) // Scale?
		gl.uniform2f(uni_s, tex[2][0], tex[2][1]);

	t.enable(tex_idx);
};

