function Material(gl, t_cache, data, base_path)
{
	this.t_cache = t_cache;
	this.depth_test = true;
	this.depth_write = true;
	this.depth_func = Material.depth_func.LEQUAL;
	this.alpha_clip = false;
	this.shinyness = 1.0;
	this.double_sided = false;
	this.blend_mode = Renderer.blend_mode.NORMAL;
	this.ambient_color = vec4.createFrom(0, 0, 0, 1);
	this.diffuse_color = vec4.createFrom(1, 1, 1, 1);
	this.textures = [null, null, null, null];
	this.uv_offsets = [null, null, null, null];
	this.uv_scales = [null, null, null, null];
	this.lights = [null, null, null, null, null, null, null, null];
	
	if(data)
	{
		var parse_color = function(self, name)
		{
			var c = data[name];
			
			if(c)
				self[name] = vec4.createFrom(c[0], c[1], c[2], c[3]);
		};
		
		var parse_tex = function(self, name, tgt, old)
		{
			var t = data[name];
			
			if(t)
			{
				var url = t.url;
				var len = url.length;
				
				self.textures[tgt] = t_cache.get(base_path + url);
				
				if(t.offset)
					self.uv_offsets[tgt] = vec2.create(t.offset);

				if(t.scale)
					self.uv_scales[tgt] = vec2.create(t.scale);
			}
		};
		
		parse_color(this, 'diffuse_color');
		parse_color(this, 'ambient_color');
		parse_tex(this, 'diffuse_color_map', Material.texture_type.DIFFUSE_COLOR);
		parse_tex(this, 'specular_color_map', Material.texture_type.SPECULAR_COLOR);
		parse_tex(this, 'emission_color_map', Material.texture_type.EMISSION_COLOR);
		parse_tex(this, 'normal_map', Material.texture_type.NORMAL);
		
		this.depth_test = data.depth_test ? data.depth_test : true;
		this.depth_write = data.depth_write ? data.depth_write : true;
		this.alpha_clip = data.alpha_clip ? data.alpha_clip : false;
		this.shinyness = data.shinyness ? data.shinyness : 0.0;
		this.double_sided = data.double_sided ? true : false;
	}
}

Material.texture_type =
{
	DIFFUSE_COLOR: 0,
	SPECULAR_COLOR: 1,
	EMISSION_COLOR: 2,
	NORMAL: 3,
	COUNT: 4 // Always last!
};

Material.depth_func =
{
	NEVER: 0,
	LESS: 1,
	EQUAL: 2,
	LEQUAL: 3,
	GREATER: 4,
	NOTEQUAL: 5,
	GEQUAL: 6,
	ALWAYS: 7,
	COUNT: 8 // Always last!
};

Material.prototype.enable = function()
{
	var r = E2.app.player.core.renderer;
	var gl = r.context;
	
	if(this.depth_test)
	{
		var depth_flags = [
			gl.NEVER, 
			gl.LESS,
			gl.EQUAL,
			gl.LEQUAL,
			gl.GREATER,
			gl.NOTEQUAL,
			gl.GEQUAL,
			gl.ALWAYS
		];
		
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(depth_flags[this.depth_func]);
	}
	else
		gl.disable(gl.DEPTH_TEST);
	
	gl.depthMask(this.depth_write);
	r.set_blend_mode(this.blend_mode);
};

Material.get_caps_hash = function(mesh, o_mat)
{
	var h = '', tt = Material.texture_type;
	var mat = o_mat ? o_mat : mesh.material;
	
	for(var v_type in VertexBuffer.vertex_type)
		h += mesh && mesh.vertex_buffers[v_type] ? '1' : '0';
	 
	h += mat.diffuse_color ? '1' : '0';
	h += mat.emission_color ? '1' : '0';
	h += mat.specular_color ? '1' : '0';
	h += mat.ambient_color ? '1' : '0';
	h += mat.alpha_clip ? '1' : '0';
	
	var tex_hash = function(om, mm)
	{
		var th = '';
		
		th += (om.textures[tt.DIFFUSE_COLOR] || (mm ? mm.textures[tt.DIFFUSE_COLOR] : undefined)) ? '1' : '0';
		th += (om.uv_offsets[tt.DIFFUSE_COLOR] || (mm ? mm.uv_offsets[tt.DIFFUSE_COLOR] : undefined)) ? '1' : '0';
		th += (om.uv_scales[tt.DIFFUSE_COLOR] || (mm ? mm.uv_scales[tt.DIFFUSE_COLOR] : undefined)) ? '1' : '0';

		th += (om.textures[tt.SPECULAR_COLOR] || (mm ? mm.textures[tt.SPECULAR_COLOR] : undefined)) ? '1' : '0';
		th += (om.uv_offsets[tt.SPECULAR_COLOR] || (mm ? mm.uv_offsets[tt.SPECULAR_COLOR] : undefined)) ? '1' : '0';
		th += (om.uv_scales[tt.SPECULAR_COLOR] || (mm ? mm.uv_scales[tt.SPECULAR_COLOR] : undefined)) ? '1' : '0';

		th += (om.textures[tt.EMISSION_COLOR] || (mm ? mm.textures[tt.EMISSION_COLOR] : undefined)) ? '1' : '0';
		th += (om.uv_offsets[tt.EMISSION_COLOR] || (mm ? mm.uv_offsets[tt.EMISSION_COLOR] : undefined)) ? '1' : '0';
		th += (om.uv_scales[tt.EMISSION_COLOR] || (mm ? mm.uv_scales[tt.EMISSION_COLOR] : undefined)) ? '1' : '0';

		th += (om.textures[tt.NORMAL_COLOR] || (mm ? mm.textures[tt.NORMAL_COLOR] : undefined)) ? '1' : '0';
		th += (om.uv_offsets[tt.NORMAL_COLOR] || (mm ? mm.uv_offsets[tt.NORMAL_COLOR] : undefined)) ? '1' : '0';
		th += (om.uv_scales[tt.NORMAL_COLOR] || (mm ? mm.uv_scales[tt.NORMAL_COLOR] : undefined)) ? '1' : '0';
		
		return th;
	};
	
	if(o_mat)
		h += tex_hash(o_mat, mesh ? mesh.material : null);
	else
		h += tex_hash(mat, null);

	for(var i = 0; i < 8; i++)
		h += mat.lights[i] ? (mat.lights[i].type === Light.type.POINT ? '2' : '1') : '0';
	
	return h;
};

if (typeof(module) !== 'undefined')
	module.exports = Material
