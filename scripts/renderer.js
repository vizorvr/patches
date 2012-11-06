function TextureSampler(tex)
{
	var self = this;
	
	this.texture = tex;
	
	var canvas = document.createElement('canvas');
	var image = tex.image;
	
	canvas.width = image.width;
	canvas.height = image.height;

	var context = canvas.getContext('2d');

	context.drawImage(image, 0, 0);

	this.imgdata = context.getImageData(0, 0, image.width, image.height);
	
	this.get_pixel = function(x, y)
	{
		var img = self.texture.image;
		
		x = x < 0 ? 0 : x > 1.0 ? 1.0 : x;
		y = y < 0 ? 0 : y > 1.0 ? 1.0 : y;

		x *= img.width - 1;
		y *= img.height - 1;
		
		var o = (Math.round(x) + (img.width * Math.round(y))) * 4
		var d = self.imgdata.data;
		
		return [d[o], d[o+1], d[o+2], d[o+3]];
	}
};

function Texture(gl)
{
	var self = this;
	
	this.gl = gl;
    	this.min_filter = gl.LINEAR;
	this.mag_filter = gl.LINEAR;
	this.texture = gl.createTexture();
	this.width = 0;
	this.height = 0;
	this.image = null;
	
	this.create = function(width, height)
	{
		self.upload(new Image(width, height));
	};
	
	this.load = function(src)
	{
		var img = new Image();
		
		img.onload = function()
		{
			msg('Finished loading texture \'' + src + '\'.');
			self.upload(img, src);
		};
		
		img.onerror = function()
		{
			Notifier.error('Failed to load texture \'' + src + '\'', 'Renderer');
		};
		
		img.src = src + '?d=' + Math.random();	
	};
	
	this.enable = function(stage)
	{
		gl.activeTexture(stage || gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.min_filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.mag_filter);
	};
	
	this.disable = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	
	this.isPow2 = function(n)
	{
		var v =  Math.log(n) / Math.log(2);	
		var v_int = Math.floor(v);
		
		return (v - v_int === 0.0);
	};
	
	this.upload = function(img, src)
	{
		self.width = img.width;
		self.height = img.height;
		self.image = img;
		
		if(!self.isPow2(self.width))
			msg('WARNING: The width (' + self.width + ') of the texture \'' + src + '\' is not a power of two.');

		if(!self.isPow2(self.height))
			msg('WARNING: The height (' + self.height + ') of the texture \'' + src + '\' is not a power of two.');
		
		self.enable();
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    		self.disable();
	};
	
	this.set_filtering = function(down, up)
	{
	    	self.min_filter = down;
		self.mag_filter = up;
	};
	
	this.get_sampler = function()
	{
		return new TextureSampler(self);
	};
}

function TextureCache(gl)
{
	var self = this;
	
	self.gl = gl;
	this.textures = {};
	
	this.get = function(url)
	{
		var ce = self.textures[url];

		if(ce !== undefined)
		{
			msg('Returning cahed version of texture \'' + url + '\'.');
			ce.count++;
			return ce.texture;
		}
		
		var t = new Texture(self.gl);
		
		msg('Fetching texture \'' + url + '\'.');
		
		t.load(url);
		self.textures[url] = { count:0, texture:t };
		
		return t;
	};
	
	this.clear = function()
	{
		this.textures = {};
	};

	this.count = function()
	{
		var c = 0;
		
		for(t in self.textures)
			++c;
			
		return c;

	};
}

function Renderer(canvas_id)
{
	var self = this;
	
  	this.canvas_id = canvas_id;
	this.canvas = $(canvas_id);
	this.framebuffer_stack = [];
	this.def_ambient = new Float32Array([0.0, 0.0, 0.0, 1.0]);
	this.def_diffuse = new Float32Array([1.0, 1.0, 1.0, 1.0]);
	this.def_specular = new Float32Array([1.0, 1.0, 1.0, 1.0]);
		
	try
	{
		this.context = this.canvas[0].getContext('experimental-webgl', { alpha: false, preserveDrawingBuffer: false, antialias: true });
	}
	catch(e)
	{
		this.context = null;
	}
	
	/*if(!this.context)
		window.location = 'http://get.webgl.org';*/

	if(false)
		this.context = WebGLDebugUtils.makeDebugContext(this.context);
	
	this.texture_cache = new TextureCache(this.context);
	this.shader_cache = new ShaderCache(this.context);
	this.fullscreen = false;
	
	this.begin_frame = function()
	{
		var gl = this.context;

		if(gl)
		{
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.clearDepth(1.0);
			gl.enable(gl.CULL_FACE);
			gl.cullFace(gl.BACK);
	    		self.update_viewport();
	    		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}	
	};
	
	this.end_frame = function()
	{
		var gl = this.context;
		
		if(gl)
			gl.flush();
	};
	
	this.push_framebuffer = function(fb, w, h)
	{
		var gl = this.context;
		
		gl.viewport(0, 0, w, h);
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		self.framebuffer_stack.push([fb, w, h]);
	};
	
	this.pop_framebuffer = function()
	{
		var fbs = self.framebuffer_stack;
		var gl = self.context;
		
		fbs.pop();
		
		if(fbs.length > 0)
		{
			var fb = fbs[fbs.length-1];
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, fb[0]);
			gl.viewport(0, 0, fb[1], fb[2]);
		}
		else
		{
			var c = self.canvas[0];
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, c.width, c.height);
		}
	};
	
	this.on_fullscreen_change = function()
	{
		var c = E2.dom.webgl_canvas;
		
		if(self.fullscreen && !document.fullscreenElement && !document.webkitFullScreenElement && !document.mozFullscreenElement)
		{
			c.attr('class', 'webgl-canvas-normal');
			c.attr('width', '480px');
			c.attr('height', '270px');
			self.fullscreen = false;
		}
		else
			self.fullscreen = true;
	};
	
	this.set_fullscreen = function(state)
	{
		var c = E2.dom.webgl_canvas;
		var cd = c[0];

		if(state)
		{
			if(!self.fullscreen)
			{
				var test = null;
				
				document.addEventListener('fullscreenchange', self.on_fullscreen_change);
				document.addEventListener('webkitfullscreenchange', self.on_fullscreen_change);
				document.addEventListener('mozfullscreenchange', self.on_fullscreen_change);
				
				if(cd.requestFullscreen)
					cd.requestFullscreen();
				if(cd.webkitRequestFullScreen)
					cd.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
				else if(cd.mozRequestFullScreen)
					cd.mozRequestFullScreen();

  				if(cd.requestFullscreen || cd.webkitRequestFullScreen || cd.mozRequestFullScreen)
  				{
	  				c.attr('class', 'webgl-canvas-fs');
					c.attr('width', '960px');
					c.attr('height', '540px');
					self.update_viewport();
  				}
  			}
		}
		else
		{
			if(self.fullscreen)
			{
				var cfs = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen;
				
				if(cfs)
				{
					c.attr('class', 'webgl-canvas-normal');
					c.attr('width', '480px');
					c.attr('height', '270px');
					self.update_viewport();
					cfs();
				}
			}
		}
	};
	
	this.update_viewport = function()
	{
		self.context.viewport(0, 0, self.canvas[0].width, self.canvas[0].height);
	};
	
	this.set_depth_enable = function(on)
	{
		var gl = self.context;

		if(on)
		{
			gl.enable(gl.DEPTH_TEST);
			gl.depthMask(true);
			gl.depthFunc(gl.LEQUAL);
			return;
		}

		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);
	};
	
	this.set_blend_mode = function(mode)
	{
		var gl = self.context;
		var bm = Renderer.blend_mode;
		
		switch(mode)
		{
			case bm.NONE:
				gl.disable(gl.BLEND);
				break;
				
			case bm.ADDITIVE:
				gl.enable(gl.BLEND);
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
				break;

			case bm.SUBTRACTIVE:
				gl.enable(gl.BLEND);
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
				break;

			case bm.MULTIPLY:
				gl.enable(gl.BLEND);
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
				break;

			case bm.MULTIPLY:
			default:
				gl.enable(gl.BLEND);
				gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
				gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				break;
		}
	};
	
}

Renderer.blend_mode = 
{
	NONE: 0,
	ADDITIVE: 1,
	SUBTRACTIVE: 2,
	MULTIPLY: 3,
	NORMAL: 4
};

function VertexBuffer(gl, v_type)
{
	var self = this;
	
	this.type = v_type;
	this.buffer = gl.createBuffer();
	this.count = 0;
	
	this.enable = function()
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, self.buffer);
	};
	
	this.bind_data = function(v_data)
	{
		self.count = v_data.length / VertexBuffer.type_stride[v_type];
		self.enable();
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v_data), gl.STATIC_DRAW);
	};
	
	this.bind_to_shader = function(shader)
	{
		shader.bind_array(self.type, self.buffer, VertexBuffer.type_stride[self.type]);
	};
}

VertexBuffer.vertex_type = 
{
	VERTEX: 0,
	NORMAL: 1,
	COLOR: 2,
	UV0: 3,
	UV1: 4,
	UV2: 5,
	UV3: 6,
	COUNT: 7 // Always last
};

VertexBuffer.type_stride = [
	3,
	3,
	4,
	2,
	2,
	2,
	2
];
	
function IndexBuffer(gl)
{
	var self = this;
	
	this.buffer = gl.createBuffer();
	this.count = 0;
	
	this.enable = function()
	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.buffer);
	};
	
	this.bind_data = function(i_data)
	{
		self.count = i_data.length;
		self.enable();
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(i_data), gl.STATIC_DRAW);
	};
}

function Light()
{
	var self = this;
	
	this.type = Light.type.POINT;
	this.diffuse_color = new Color(1, 1, 1, 1);
	this.specular_color = new Color(1, 1, 1, 1);
	this.position = [0, 1, 0];
	this.direction = [0, -1, 0];
	this.intensity = 1.0;
}

Light.type = 
{
	POINT: 0,
	DIRECTIONAL: 1,
	COUNT: 2 // Always last!
};

Light.mask_no_light = '--------';

function Material(gl, t_cache, data, base_path)
{
	var self = this;
	
	this.t_cache = t_cache;
	this.depth_test = true;
	this.depth_write = true;
	this.depth_func = Material.depth_func.LEQUAL;
	this.alpha_clip = false;
	this.shinyness = 1.0;
	this.double_sided = false;
	this.blend_mode = Renderer.blend_mode.NORMAL;
	this.ambient_color = new Color(0, 0, 0, 1);
	this.diffuse_color = new Color(1, 1, 1, 1);
	this.textures = [];
	this.lights = [null, null, null, null, null, null, null, null];
	
	if(data)
	{
		var parse_color = function(name)
		{
			var c = data[name];
			
			if(c)
				self[name] = new Color(c[0], c[1], c[2], c[3]);
		};
		
		// TODO: Change all this!
		var parse_tex = function(name, tgt, old)
		{
			var t = data[name];
			
			if(t)
			{
				var url = t;
				
				if(!old)
					url = t.url;
				
				self.textures[tgt] = t_cache.get(base_path + url);
				
				var ext = url.substring(url.length - 3, url.length).toLowerCase();
				
				if(ext == 'png')
					self.alpha_clip = true;
			}
		};
		
		parse_color('diffuse_color');
		parse_color('ambient_color');
		
		// Old style
		parse_tex('diffuse_tex', Material.texture_type.DIFFUSE_COLOR, true);
		parse_tex('emission_tex', Material.texture_type.EMISSION_COLOR, true);
		parse_tex('specular_tex', Material.texture_type.SPECULAR_COLOR, true);
		parse_tex('normal_tex', Material.texture_type.NORMAL, true);	 

		// New style
		parse_tex('diffuse_color_map', Material.texture_type.DIFFUSE_COLOR);
		parse_tex('specular_color_map', Material.texture_type.SPECULAR_COLOR);
		parse_tex('emission_color_map', Material.texture_type.EMISSION_COLOR);
		parse_tex('normal_map', Material.texture_type.NORMAL);
		
		this.depth_test = data.depth_test ? data.depth_test : true;
		this.depth_write = data.depth_write ? data.depth_write : true;
		this.alpha_clip = data.alpha_clip ? data.alpha_clip : false;
		self.shininess = data.shininess ? data.shininess : 0.0;
		self.double_sided = data.double_sided ? true : false;
	}
	
	this.enable = function()
	{
		var r = E2.app.core.renderer;
		var gl = r.context;
		
		if(self.depth_test)
		{
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc([gl.NEVER, 
				      gl.LESS,
				      gl.EQUAL,
				      gl.LEQUAL,
				      gl.GREATER,
				      gl.NOTEQUAL,
				      gl.GEQUAL,
				      gl.ALWAYS][self.depth_func]);
		}
		else
			gl.disable(gl.DEPTH_TEST);
		
		gl.depthMask(self.depth_write);
		r.set_blend_mode(self.blend_mode);
	};
	
	this.get_light_mask = function()
	{
		var msk = '';
		
		for(var i = 0; i < 8; i++)
			msk += self.lights[i] ? '' + self.lights[i].type : '-';
	
		return msk;
	};
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

function Mesh(gl, prim_type, t_cache, data, base_path)
{
	var self = this;
	
	this.prim_type = prim_type;
	this.vertex_buffers = {}; // VertexBuffer.vertex_type
	this.index_buffer = null;
	this.t_cache = t_cache;
	this.material = new Material();
	this.vertex_count = 0;
	
	for(var v_type in VertexBuffer.vertex_type)
		this.vertex_buffers[v_type] = null;
		
	if(data)
	{
		if(data.vertices)
		{
			var verts = this.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX);
		
			self.vertex_count = data.vertices.length / 3;
			verts.bind_data(data.vertices);
		}

		if(data.normals)
		{
			var norms = this.vertex_buffers['NORMAL'] = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL);
		
			norms.bind_data(data.normals);
		}
		else // Compute normals
		{
			var vts = data.verts,
			    p1 = null,
			    p2 = null,
			    p3 = null;
			
			self.face_norms = [];
			
			if(data.indices)
			{
				var idx = data.indices;
				
				for(var i = 0, len = idx.length; i < len; i += 3)
				{
					p1 = idx[i]*3;
					p2 = idx[i+1]*3;
					p3 = idx[i+2]*3;
					
					var v1 = [vts[p1] - vts[p3], vts[p1+1] - vts[p3+1], vts[p1+2] - vts[p3+2]];
					var v2 = [vts[p1] - vts[p2], vts[p1+1] - vts[p2+1], vts[p1+2] - vts[p2+2]];
					
					var n = [v1[1] * v2[2] - v1[2] * v2[1],
					         v1[2] * v2[0] - v1[0] * v2[2],
					         v1[0] * v2[1] - v1[1] * v2[0]];
					         
					var l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
					
					if(l > 0.000001)
					{
						n[0] /= l;
						n[1] /= l;
						n[2] /= l;
					}
					
					self.face_norms.push(n[0]);
					self.face_norms.push(n[1]);
					self.face_norms.push(n[2]);
				}
				
				// TODO: Use index buffer to calculate proper vertex normals.
			}
			else
			{
				var ndata = [];
				
				for(var i = 0, len = vts.length/3; i < len; i += 3)
				{
					p1 = i*3;
					p2 = (i+1)*3;
					p3 = (i+2)*3;
					
					var v1 = [vts[p1] - vts[p3], vts[p1+1] - vts[p3+1], vts[p1+2] - vts[p3+2]];
					var v2 = [vts[p1] - vts[p2], vts[p1+1] - vts[p2+1], vts[p1+2] - vts[p2+2]];
					
					var n = [v1[1] * v2[2] - v1[2] * v2[1],
					         v1[2] * v2[0] - v1[0] * v2[2],
					         v1[0] * v2[1] - v1[1] * v2[0]];
					         
					var l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
					
					if(l > 0.000001)
					{
						n[0] /= l;
						n[1] /= l;
						n[2] /= l;
					}
					
					self.face_norms.push(n[0]);
					self.face_norms.push(n[1]);
					self.face_norms.push(n[2]);
					
					for(var c = 0; c < 3; c++)
					{
						ndata.push(n[0]);
						ndata.push(n[1]);
						ndata.push(n[2]);
					}
				}
				
				var norms = this.vertex_buffers['NORMAL'] = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL);

				norms.bind_data(ndata);
			}
		}
		
		if(data.uv0)
		{
  			var uv0 = this.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0);
		
			uv0.bind_data(data.uv0);
		}
		
		if(data.indices)
		{
			var idx = this.index_buffer = new IndexBuffer(gl);
			
			idx.bind_data(data.indices);
		}
	}
	
	this.render = function(camera, transform, shader)
	{
        	var verts = self.vertex_buffers['VERTEX'];
        	var shader = shader || self.shader;
        	
        	if(!verts || !shader)
        		return;
        	
        	shader.enable();
        	
        	for(var v_type in VertexBuffer.vertex_type)
        	{
        		var vb = self.vertex_buffers[v_type];
        		
        		if(vb)
        			vb.bind_to_shader(shader);
        	}

		shader.bind_camera(camera);
       		shader.apply_uniforms(this);
		
		if(!self.instances)
		{
			gl.uniformMatrix4fv(shader.m_mat, false, transform);
			
			if(!self.index_buffer)
			{
				gl.drawArrays(self.prim_type, 0, verts.count);
			}
			else
			{
				self.index_buffer.enable();
				gl.drawElements(self.prim_type, self.index_buffer.count, gl.UNSIGNED_SHORT, 0);
			}
		}
		else
		{
			var inst = self.instances;
			var ft = mat4.create();
			
			if(!self.index_buffer)
			{
				for(var i = 0, len = inst.length; i < len; i++)
				{
					if(!transform.invert)
						mat4.multiply(inst[i], transform, ft);
					else
						mat4.multiply(transform, inst[i], ft);
				
					gl.uniformMatrix4fv(shader.m_mat, false, ft);
					gl.drawArrays(self.prim_type, 0, verts.count);
				}
			}
			else
			{
				self.index_buffer.enable();

				for(var i = 0, len = inst.length; i < len; i++)
				{
					if(!transform.invert)
						mat4.multiply(inst[i], transform, ft);
					else
						mat4.multiply(transform, inst[i], ft);
				
					gl.uniformMatrix4fv(shader.m_mat, false, ft);
					gl.drawElements(self.prim_type, self.index_buffer.count, gl.UNSIGNED_SHORT, 0);
				}
			}
		}
	};
}

function Color(r, g, b, a)
{
	this.rgba = [r, g, b, a || 1.0];
}

function ComposeShader(cache, mesh, material, uniforms_vs, uniforms_ps, vs_custom, ps_custom)
{
	var gl = E2.app.core.renderer.context;
	var self = this;
	var streams = [];
	var v_types = VertexBuffer.vertex_type;
	var has_lights = false;
	var lights = material ? material.lights : [null, null, null, null, null, null, null, null];
	
	for(var v_type in v_types)
	{
		var index = v_types[v_type];
		
		streams[index] = mesh.vertex_buffers[v_type] !== null;
	}		
	
	this.material = material;
	this.apply_uniforms_custom = null;
		
	var exists = false;
	var prog = null;
			
	/*if(cache)
	{
		// TODO: This need revision, badly.
		var cached = cache.get(mesh, material);
		
		exists = cached[0];
		prog = cached[1]; 
	}*/

	var shader = new ShaderProgram(gl, prog);
	
	shader.material = self.material;
	
	prog = shader.program;
	
	if(!exists)
	{
		var vs_src = [];
		var ps_src = [];
		var vs_c_src = [];
		var ps_c_src = [];

		shader.streams = streams;
	
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
		vs_src.push('uniform vec4 d_col;');
		vs_src.push('uniform mat4 m_mat;');
		vs_src.push('uniform mat4 v_mat;');
		vs_src.push('uniform mat4 p_mat;');
		vs_src.push('varying vec4 f_col;');
		vs_src.push(uniforms_vs);
	
		ps_src.push('precision lowp float;');
		ps_src.push('uniform vec4 a_col;');
		ps_src.push('uniform int e2_alpha_clip;');
		ps_src.push('varying vec4 f_col;');
		ps_src.push(uniforms_ps);
	
		if(streams[v_types.COLOR])
			vs_src.push('attribute vec4 v_col;');

		if(streams[v_types.NORMAL])
		{
			vs_src.push('uniform mat4 n_mat;');
			vs_src.push('attribute vec3 v_norm;');
			vs_src.push('varying vec3 f_norm;');
		
			ps_src.push('varying vec3 f_norm;');
		
			for(var i = 0; i < 8; i++)
			{
				var l = lights[i];
			
				if(l)
				{
					var lid = 'l' + i;
				
					ps_src.push('uniform vec3 ' + lid + '_pos;');
					ps_src.push('uniform vec4 ' + lid + '_d_col;');
					ps_src.push('uniform vec4 ' + lid + '_s_col;');
					ps_src.push('uniform float ' + lid + '_power;');
				
					if(l.type === Light.type.DIRECTIONAL)
						ps_src.push('uniform vec3 ' + lid + '_dir;');
				
					has_lights = true;
				}
			}
		
			if(has_lights)
			{
				vs_src.push('varying vec3 view_pos;');
				ps_src.push('varying vec3 view_pos;');
				ps_src.push('uniform vec4 s_col;');
				ps_src.push('uniform float shinyness;');
			}
		}
	
		if(streams[v_types.UV0])
		{
			vs_src.push('attribute vec2 v_uv0;');
			vs_src.push('varying vec2 f_uv0;');

			ps_src.push('uniform sampler2D tex0;');
			ps_src.push('varying vec2 f_uv0;');
		}

		if(!vs_custom)
		{
			vs_dp('void main(void) {');
	
			if(has_lights)
				vs_dp('    view_pos = (v_mat * m_mat * vec4(v_pos, 1.0)).xyz;');	
	
			vs_dp('    gl_Position = p_mat * v_mat * m_mat * vec4(v_pos, 1.0);');

			if(streams[v_types.NORMAL])
				vs_dp('    f_norm = normalize((n_mat * vec4(v_norm, 0.0)).xyz);');
	
			if(streams[v_types.COLOR])
				vs_dp('    dc = dc * v_col;');

			if(streams[v_types.UV0])
				vs_dp('    f_uv0 = v_uv0;');		

			vs_dp('    f_col = d_col;');
			vs_dp('}');
		}
		else
		{
			vs_dp(vs_custom);
		}
	
		if(!ps_custom)
		{
			ps_dp('void main(void) {');
			ps_dp('    vec4 fc = vec4(a_col.rgb, f_col.a);');

			if(streams[v_types.NORMAL] && has_lights)
			{
				ps_dp('    vec3 n_dir = normalize(f_norm);');
				ps_dp('    vec3 v_dir = -normalize(view_pos);');
		
				for(var i = 0; i < 8; i++)
				{
					var l = lights[i];
			
					if(l)
					{
						var lid = 'l' + i;
						var liddir = lid + '_dir';
				
						if(l.type === Light.type.DIRECTIONAL)
							ps_dp('    vec3 ' + liddir + ' = normalize(' + lid + '_pos);');
						else
							ps_dp('    vec3 ' + liddir + ' = normalize(' + lid + '_pos - view_pos);');
				
						ps_dp('    float ' + lid + '_dd = dot(n_dir, ' + liddir + ');');
						ps_dp('    fc += ' + lid + '_d_col * f_col * max(0.0, ' + lid + '_dd) * ' + lid + '_power;');
						ps_dp('    if(' + lid +'_dd >= 0.0)');
			
						var s = '        fc += ' + lid + '_power * vec4(';
				
						if(l.type !== Light.type.DIRECTIONAL)
							s += '(1.0 / length(' + liddir + ')) * ';
					
						ps_dp(s + 'vec3(' + lid + '_s_col) * s_col.rgb * pow(max(0.0, dot(-reflect(' + liddir + ', n_dir), v_dir)), 1.0 / (1.0 + shinyness)), 0.0);');
					}
				}
			}
	
			if(streams[v_types.UV0])
			{
				if(has_lights)
					ps_dp('    fc = fc * texture2D(tex0, f_uv0.st);');
				else
					ps_dp('    fc = vec4(fc.rgb + f_col.rgb, f_col.a) * texture2D(tex0, f_uv0.st);');
			}
	
			ps_dp('    if(e2_alpha_clip > 0 && fc.a < 0.5) discard;');
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

		var vs = new Shader(gl, gl.VERTEX_SHADER, shader.vs_src);
		var ps = new Shader(gl, gl.FRAGMENT_SHADER, shader.ps_src);

		shader.attach(vs);
		shader.attach(ps);
		shader.link();
	}
	
	var gl_resolve = function(uid)
	{
		var ep = gl.getAttribLocation(prog, uid);
		
		return ep !== undefined && ep !== -1 ? ep : undefined;
	};
	 
	shader.v_pos = gl.getAttribLocation(prog, "v_pos");
	shader.v_norm = gl.getAttribLocation(prog, "v_norm");
	shader.m_mat = gl.getUniformLocation(prog, "m_mat");
	shader.v_mat = gl.getUniformLocation(prog, "v_mat");
	shader.p_mat = gl.getUniformLocation(prog, "p_mat");
	shader.a_col = gl.getUniformLocation(prog, "a_col");
	shader.d_col = gl.getUniformLocation(prog, "d_col");
	shader.e2_alpha_clip = gl.getUniformLocation(prog, "e2_alpha_clip");

	if(has_lights)
	{
		shader.s_col = gl.getUniformLocation(prog, "s_col");
		shader.shinyness = gl.getUniformLocation(prog, "shinyness");
		shader.n_mat = gl.getUniformLocation(prog, "n_mat");
	
		for(var i = 0; i < 8; i++)
		{
			var l = lights[i];
			
			if(l)
			{
				var lid = 'l' + i;

				shader[lid + '_pos'] = gl.getUniformLocation(prog, lid + '_pos');
				shader[lid + '_d_col'] = gl.getUniformLocation(prog, lid + '_d_col');
				shader[lid + '_s_col'] = gl.getUniformLocation(prog, lid + '_s_col');
				shader[lid + '_power'] = gl.getUniformLocation(prog, lid + '_power');
				
				if(l.type === Light.type.DIRECTIONAL)
					shader[lid + '_dir'] = gl.getUniformLocation(prog, lid + '_dir');
			}
		}
	}

	if(streams[v_types.COLOR])
		shader.v_col = gl.getAttribLocation(prog, "v_col");

	if(streams[v_types.UV0])
	{
		shader.v_uv0 = gl.getAttribLocation(prog, "v_uv0");
		shader.tex0 = gl.getUniformLocation(prog, "tex0");
	}
	
	shader.bind_array = function(type, data, item_size)
	{
		var types = VertexBuffer.vertex_type;
		var attr = -1;
		
		if(type === types.VERTEX)
			attr = this.v_pos;
		else if(type === types.UV0)
			attr = this.v_uv0;
		else if(type === types.NORMAL)
			attr = this.v_norm;
		else if(type === types.COLOR)
			attr = this.v_col;
		
		// This can happen if the symbol is declared but unused. Some
		// drivers optimize the shaders and eliminate dead code.
		if(attr === -1)
			return;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, data);
		gl.enableVertexAttribArray(attr);
		gl.vertexAttribPointer(attr, item_size, gl.FLOAT, false, 0, 0);
	};
	
	shader.apply_uniforms = function(mesh)
	{
		var r = E2.app.core.renderer;
		var m = this.material ? this.material : mesh.material;

		gl.enableVertexAttribArray(this.v_pos);
		gl.uniform1i(this.e2_alpha_clip, m.alpha_clip ? 1 : 0);
		gl.uniform4fv(this.a_col, (m.ambient_color) ? new Float32Array(m.ambient_color.rgba) : r.def_ambient);
		gl.uniform4fv(this.d_col, (m.diffuse_color) ? new Float32Array(m.diffuse_color.rgba) : r.def_diffuse);
		
		if(this.s_col !== undefined)
			gl.uniform4fv(this.s_col, (m.specular_color) ? new Float32Array(m.specular_color.rgba) : r.def_specular);
		
		if(this.shinyness !== undefined)
			gl.uniform1f(this.shinyness, m.shinyness);
		
		for(var i = 0; i < 8; i++)
		{
			var l = lights[i];
			
			if(l)
			{
				var lid = 'l' + i;

				gl.uniform3fv(this[lid + '_pos'], l.position);
				gl.uniform4fv(this[lid + '_d_col'], l.diffuse_color.rgba);
				gl.uniform4fv(this[lid + '_s_col'], l.specular_color.rgba);
				gl.uniform1f(this[lid + '_power'], l.intensity);
				
				if(l.type === Light.type.DIRECTIONAL)
					gl.uniform3fv(this[lid + '_dir'], l.direction);
			}
		}

		if(this.v_norm !== undefined && this.v_norm !== -1)
			gl.enableVertexAttribArray(this.v_norm);
		
		if(this.v_uv0 !== undefined && this.v_uv0 !== -1)
		{
			var diffuse_set = false;

			gl.enableVertexAttribArray(this.v_uv0);

			if(self.material)
			{
				var dt = this.material.textures[Material.texture_type.DIFFUSE_COLOR];

				if(dt)
				{
					gl.uniform1i(this.tex0, 0);
					dt.enable(gl.TEXTURE0);
					diffuse_set = true;
				}
			}

			if(!diffuse_set)
			{
				var dt = mesh.material.textures[Material.texture_type.DIFFUSE_COLOR];

				if(dt)
				{
					gl.uniform1i(this.tex0, 0);
					dt.enable(gl.TEXTURE0);
				}
				else
					gl.bindTexture(gl.TEXTURE_2D, null);
			}
		}
		
		if(this.apply_uniforms_custom)
			this.apply_uniforms_custom();
		
		if(m.double_sided)
			gl.disable(gl.CULL_FACE);
		else
			gl.enable(gl.CULL_FACE);
	
		m.enable();
	};
	
	return shader;
}

function ShaderCache(gl)
{
	var self = this;
	
	this.programs = {};
	
	this.build_key = function(mesh, m)
	{
		var k = '';
		
		for(var i = 0, len = VertexBuffer.vertex_type.COUNT; i <len; i++)
			k += mesh.vertex_buffers[i] ? '1' : '0';
		 
		k += m.diffuse_color ? '1' : '0';
		k += m.emission_color ? '1' : '0';
		k += m.specular_color ? '1' : '0';
		k += m.ambient_color ? '1' : '0';
		k += m.alpha_clip ? '1' : '0';
		k += m.textures[Material.texture_type.DIFFUSE_COLOR] ? '1' : '0';
		k += m.textures[Material.texture_type.EMISSION_COLOR] ? '1' : '0';
		k += m.textures[Material.texture_type.SPECULAR_COLOR] ? '1' : '0';
		k += m.textures[Material.texture_type.NORMAL] ? '1' : '0';
	
		for(var i = 0; i < 8; i++)
			k += m.lights[i] ? '1' : '0';
		
		return k;
	};
	
	this.get = function(mesh, mat)
	{
		var key = self.build_key(mesh, mat);
		var exists = key in self.programs;
		var prog = null;
		
		if(exists)
			prog = self.programs[key];
		else
		{
			self.programs[key] = prog = gl.createProgram();
			msg('Caching shader: ' + key);
		}
		
		return [exists, prog];
	}
	
	this.count = function()
	{
		var c = 0;
		
		for(p in self.programs)
			++c;
			
		return c;
	};
}

function Shader(gl, type, src)
{
	this.shader = gl.createShader(type);
	
	gl.shaderSource(this.shader, src);
	gl.compileShader(this.shader);
	
	if(!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS))
	{
		Notifier.error('Shader compilation failed:\n' + gl.getShaderInfoLog(this.shader), 'Renderer');
		msg('Shader compilation failed:\n' + gl.getShaderInfoLog(this.shader));
	}
}

function ShaderProgram(gl, program)
{
	var self = this;
	
	this.gl = gl;
	this.program = program || gl.createProgram();

	this.attach = function(shader)
	{
		self.gl.attachShader(self.program, shader.shader);
	};
	
	this.link = function()
	{
		self.gl.linkProgram(self.program);

		if(!self.gl.getProgramParameter(self.program, gl.LINK_STATUS))
		{
      			Notifier.error('Shader linking failed:\n' + gl.getProgramInfoLog(self.program), 'Renderer');
			msg('Shader linking failed:\n' + gl.getProgramInfoLog(self.program));
		}
		
		gl.validateProgram(self.program);
		
		if(!gl.getProgramParameter(self.program, gl.VALIDATE_STATUS))
		{
      			Notifier.error('Shader validation failed:\n' + gl.getProgramInfoLog(self.program), 'Renderer');
      			msg('Shader validation failed:\n' + gl.getProgramInfoLog(self.program));
      		}
      	};
      	
      	this.enable = function()
      	{
		self.gl.useProgram(self.program);
      	};

	this.bind_camera = function(camera)
	{
		gl.uniformMatrix4fv(self.v_mat, false, camera.view);
		gl.uniformMatrix4fv(self.p_mat, false, camera.projection);
		
		if(self.n_mat)
			gl.uniformMatrix4fv(self.n_mat, false, camera.normal);
	};
	
	this.bind_transform = function(transform)
	{
		gl.uniformMatrix4fv(self.m_mat, false, transform);
	};
}

function Camera(gl)
{
	var self = this;
	
	this.gl = gl;
	this.projection = mat4.create();
	this.view = mat4.create();
	this.normal = mat4.create();
	
	mat4.identity(this.projection);
	mat4.identity(this.view);
	mat4.identity(this.normal);
	
	this.update_normal = function()
	{
		var inv = mat4.create();
		
		mat4.inverse(self.view, inv);
		mat4.transpose(inv, self.normal);
	};
}
	
function Scene(gl, data, base_path)
{
	var self = this;
	
	this.gl = gl;
	this.texture_cache = E2.app.core.renderer.texture_cache /*new TextureCache(gl)*/;
	this.shader_cache = E2.app.core.renderer.shader_cache /*new ShaderCache(gl)*/;
	this.meshes = [];
	this.materials = {};
	this.id = 'n/a';
	this.vertex_count = 0;

	if(data)
	{
		this.id = data.id;
		
		this.bounding_box = data.bounding_box || { "lo": [0.0, 0.0, 0.0], "hi": [0.0, 0.0, 0.0] };
		 
		for(var id in data.materials)
		{
			if(!data.materials.hasOwnProperty(id))
				continue;
			
			self.materials[id] = new Material(gl, self.texture_cache, data.materials[id], base_path);
		}
		
		for(var id in data.meshes)
		{
			if(!data.meshes.hasOwnProperty(id))
				continue;
				
			var m = data.meshes[id];
			
			for(var b = 0, len = m.batches.length; b < len; b++)
			{
				var batch = m.batches[b];
				var mesh = new Mesh(gl, gl.TRIANGLES, this.texture_cache, batch, base_path);
			
				mesh.id = id + '_b' + b;
				mesh.material = self.materials[batch.material];
				mesh.shader = ComposeShader(self.shader_cache, mesh, mesh.material, null, null, null, null);
			
				this.meshes.push(mesh);
				this.vertex_count += mesh.vertex_count;
			}
		}
	}
	
	this.render = function(gl, camera, transform, shader)
	{
		var meshes = self.meshes;
		
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK); 
		gl.enable(gl.DEPTH_TEST);
		gl.depthMask(true);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.BLEND);
		gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		if(shader)
		{
			for(var i = 0, len = meshes.length; i < len; i++)
				meshes[i].render(camera, transform, shader);
		}
		else
		{
			for(var i = 0, len = meshes.length; i < len; i++)
			{
				var m = meshes[i];
			
				m.render(camera, transform, m.shader);
			}
		}
	};
	
	this.create_autofit_camera = function()
	{
		var bb = self.bounding_box;
		var cam = new Camera();
		
		// If we have no bounding box, default to the old-fashioned 
		//screenspace cam in lieu of something better.
		if(!bb)
			return cam;
		
		var c = E2.app.core.renderer.canvas;
		var pos = [bb.hi[0] * 3.0, bb.hi[1] * 3.0, bb.hi[2] * 3.0];
		var d = vec3.create(), tar = vec3.create();
		
		vec3.subtract(bb.hi, bb.lo, d);
		
		var dist = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] + d[2]) * 8.0;
		
		vec3.add(bb.lo, vec3.scale(d, 0.5, tar), tar);
		
		pos[0] = tar[0];
		
		msg('New autofit camera: ' + pos + ' ... ' + tar[0] + ',' + tar[1] + ',' + tar[2] + ' ... ' + dist);
		mat4.perspective(45.0, c.width() / c.height(), 1.0, 1.0 + dist, cam.projection);
		mat4.lookAt(pos, tar, [0.0, 0.0, 1.0], cam.view);
		
		return cam;
	}
	
};

Scene.load = function(gl, url)
{
	var scene = null;
	
	jQuery.ajax({
		url: url, 
		dataType: 'json',
		success: function(data) 
		{
			var bp = url.substr(0, url.lastIndexOf('/') + 1);
			var r = E2.app.core.renderer;
			
			scene = new Scene(gl, data, bp);
			msg('Scene: Finished loading assets from "' + bp + '". Meshes: ' + scene.meshes.length + ', Shaders: ' + scene.shader_cache.count() + ', Textures: ' + scene.texture_cache.count() + ', Vertices: ' + scene.vertex_count);
			msg('Global cache state: ' + r.texture_cache.count() + ' textures. ' + r.shader_cache.count() + ' shaders.');
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			Notifier.error('Failed to load scene "' + url + '": ' + textStatus + ', ' + errorThrown, 'Renderer');
		},
		async:   false
	});
	
	return scene;
};

