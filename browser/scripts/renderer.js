function Texture(renderer, handle, filter)
{
	var gl = this.gl = renderer.context;

	this.renderer = renderer;
	this.min_filter = this.mag_filter = filter || gl.LINEAR;
	this.texture = handle || gl.createTexture();
	this.width = 0;
	this.height = 0;
	this.image = null;
	this.complete = true;
}

Texture.prototype.create = function(width, height)
{
	this.upload(new Image(width, height), 'Internal Create');
};

Texture.prototype.drop = function()
{
	this.gl.deleteTexture(this.texture);
	this.texture = null;
};

Texture.prototype.load = function(src, core)
{
	var img = new Image();
	
	img.onload = function(self, src, c) { return function()
	{
		msg('INFO: Finished loading texture \'' + src + '\'.');
		self.upload(img, src);
		c.asset_tracker.signal_completed();
	}}(this, src, core);
	
	img.onerror = function(self, src, c) { return function()
	{
		var dt = c.renderer.default_tex;

		msg('ERROR: Failed to load texture \'' + src + '\'', 'Renderer');
		c.asset_tracker.signal_failed();

		self.drop();
		self.texture = dt.texture;
		self.width = dt.width;
		self.height = dt.height;
	}}(this, src, core);
	
	this.complete = false;
	core.asset_tracker.signal_started();
	img.src = src;	
};

Texture.prototype.enable = function(stage)
{
	var gl = this.gl;
	
	if(gl.bound_tex_stage !== stage || gl.bound_tex !== this.texture) // Don't rebind
	{
		gl.activeTexture(stage || gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		this.renderer.extensions.set_anisotropy(4);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.min_filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.mag_filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.bound_tex_stage = stage;
		gl.bound_tex = this.texture;
	}
};

Texture.prototype.disable = function()
{
	var gl = this.gl;
	
	gl.bindTexture(gl.TEXTURE_2D, null);
};

Texture.prototype.isPow2 = function(n)
{
	var v =  Math.log(n) / Math.log(2);	
	var v_int = Math.floor(v);
	
	return (v - v_int === 0.0);
};

// Accepts both Image and Canvas instances.
Texture.prototype.upload = function(img, src)
{
	var w = img.width || img.videoWidth;
	var h = img.height || img.videoHeight;
	
	if(!this.isPow2(w))
	{
		msg('ERROR: The width (' + w + ') of the texture \'' + src + '\' is not a power of two.');
		return;
	}
	
	if(!this.isPow2(h))
	{
		msg('ERROR: The height (' + h + ') of the texture \'' + src + '\' is not a power of two.');
		return;
	}
	
	var gl = this.gl;
	
	this.width = w;
	this.height = h;
	this.image = img;

	this.enable();
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	this.disable();
	
	this.complete = true;
};

Texture.prototype.set_filtering = function(down, up)
{
	this.min_filter = down;
	this.mag_filter = up;
};

function TextureCache(gl, core)
{
	this.gl = gl;
	this.core = core;
	this.textures = {};
}

TextureCache.prototype.get = function(url)
{
	var ce = this.textures[url];

	if(ce !== undefined)
	{
		msg('INFO: Returning cahed version of texture \'' + url + '\'.');
		ce.count++;
		return ce.texture;
	}
	
	var t = new Texture(this.core.renderer);
	
	msg('INFO: Fetching texture \'' + url + '\'.');
	
	t.load(url, this.core);
	this.textures[url] = { count:0, texture:t };
	
	return t;
};

TextureCache.prototype.clear = function()
{
	this.textures = {};
};

TextureCache.prototype.count = function()
{
	var c = 0;
	var ts = this.textures;
	
	for(var t in ts)
	{
		if(ts.hasOwnProperty(t))
			++c;
	}
		
	return c;
};

function Extensions(gl)
{
	this.gl = gl;

	this.max_anisotropy = 0;
	this.anisotropic = gl.getExtension('EXT_texture_filter_anisotropic') || 
			   gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || 
			   gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
	
	if(this.anisotropic)
		this.max_anisotropy = gl.getParameter(this.anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
}

Extensions.prototype.set_anisotropy = function(level)
{
	if(this.anisotropic)
	{
		if(this.max_anisotropy > 0)
			this.gl.texParameterf(this.gl.TEXTURE_2D, this.anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, this.max_anisotropy);
	}
};

function Renderer(vr_devices, canvas_id, core)
{
	this.vr_hmd = vr_devices[0];
	this.vr_sensor = vr_devices[1];
	this.canvas_id = canvas_id;
	this.canvas = $(canvas_id);
	this.framebuffer_stack = [];
	this.def_ambient = vec4.createFrom(0, 0, 0, 1);
	this.def_diffuse = vec4.createFrom(1, 1, 1, 1);
	this.def_specular = vec4.createFrom(1, 1, 1, 1);
	this.up_vec = vec3.createFrom(0, 0, 1);
	
	this.org_width = this.canvas.width();
	this.org_height = this.canvas.height();
	
	try
	{
		var ctx_opts = { alpha: false, preserveDrawingBuffer: false, antialias: true };
		
		this.context = this.canvas[0].getContext('webgl', ctx_opts);
		
		if(!this.context)
			this.context = this.canvas[0].getContext('experimental-webgl', ctx_opts);
			
		// Debugging.
		// this.context = WebGLDebugUtils.makeDebugContext(this.context);
	}
	catch(e)
	{
		this.context = null;
	}
	
	if(!this.context)
		window.location = 'no_webgl.html';
	
	this.extensions = new Extensions(this.context);
	this.texture_cache = new TextureCache(this.context, core);
	this.shader_cache = new ShaderCache(this.context);
	this.fullscreen = false;
	this.default_tex = new Texture(this);
	this.default_tex.load('../images/no_texture.png', core);

	document.addEventListener('fullscreenchange', this.on_fullscreen_change(this));
	document.addEventListener('webkitfullscreenchange', this.on_fullscreen_change(this));
	document.addEventListener('mozfullscreenchange', this.on_fullscreen_change(this));
	
	// Constants, to cut down on wasted objects in slot definitions.
	this.camera_screenspace = new Camera(this.context);
	this.light_default = new Light();
	this.material_default = new Material();
	this.color_white = vec4.createFrom(1, 1, 1, 1);
	this.color_black = vec4.createFrom(0, 0, 0, 1);
	this.vector_origin = vec3.createFrom(0, 0, 0);
	this.vector_unity = vec3.createFrom(1, 1, 1);
	this.matrix_identity = mat4.create();
	
	mat4.identity(this.matrix_identity);
}

Renderer.blend_mode = 
{
	NONE: 0,
	ADDITIVE: 1,
	SUBTRACTIVE: 2,
	MULTIPLY: 3,
	NORMAL: 4
};

Renderer.prototype.begin_frame = function()
{
	var gl = this.context;

	if(gl)
	{
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
		gl.bound_tex = null;
		gl.bound_tex_stage = null;
		gl.bound_mesh = null;
		gl.bound_shader = null;

		// this.update_viewport();
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}	
};

Renderer.prototype.end_frame = function()
{
	var gl = this.context;
	
	if(gl)
		gl.flush();
};

Renderer.prototype.push_framebuffer = function(fb, w, h)
{
	var gl = this.context;
	
	gl.viewport(0, 0, w, h);
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	this.framebuffer_stack.push([fb, w, h]);
};

Renderer.prototype.pop_framebuffer = function()
{
	var fbs = this.framebuffer_stack;
	var gl = this.context;
	
	fbs.pop();
	
	if(fbs.length > 0)
	{
		var fb = fbs[fbs.length-1];
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb[0]);
		gl.viewport(0, 0, fb[1], fb[2]);
	}
	else
	{
		var c = this.canvas[0];
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, c.width, c.height);
	}
};

Renderer.prototype.on_fullscreen_change = function(self) { return function()
{
	var c = E2.dom.webgl_canvas;
	
	if(self.fullscreen && !document.fullscreenElement && !document.webkitFullScreenElement && !document.mozFullscreenElement)
	{
		c.attr('class', 'webgl-canvas-normal');
		c.attr('width', '' + self.org_width + 'px');
		c.attr('height', '' + self.org_height + 'px');
		self.update_viewport();
		self.fullscreen = false;
	}
	else
	{
		self.fullscreen = true;
		document.fullscreenElement = document.webkitFullScreenElement = document.mozFullscreenElement = null;
	}
}};

Renderer.prototype.set_fullscreen = function(state)
{
	var c = E2.dom.webgl_canvas;
	var cd = c[0];

	if(state)
	{
		if(!this.fullscreen)
		{
			if(this.vr_hmd)
			{
				// NOTE: This breaks keyboard input in FS mode on webkit-based
				// browsers. On the other hand, the change bypasses a known 
				// Safari bug, see:
				// http://stackoverflow.com/questions/8427413/webkitrequestfullscreen-fails-when-passing-element-allow-keyboard-input-in-safar
				var opt = { vrDisplay: this.vr_hmd };

				if(cd.requestFullscreen)
					cd.requestFullscreen(opt);
				if(cd.webkitRequestFullscreen) // Note the lowercase 's'!
					cd.webkitRequestFullscreen(opt);
				else if(cd.mozRequestFullScreen)
					cd.mozRequestFullScreen(opt);
			}
			else
			{
				if(cd.requestFullscreen)
					cd.requestFullscreen();
				if(cd.webkitRequestFullScreen)
					cd.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
				else if(cd.mozRequestFullScreen)
					cd.mozRequestFullScreen();
			}
		
			c.attr('class', 'webgl-canvas-fs');
			c.attr('width', '1200px');
			c.attr('height', '800px');
			this.update_viewport();
		}
	}
	else
	{
		if(this.fullscreen)
		{
			var cfs = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen;
			
			if(cfs)
			{
				c.attr('class', 'webgl-canvas-normal');
				c.attr('width', '' + this.org_width + 'px');
				c.attr('height', '' + this.org_height + 'px');
				this.update_viewport();
				cfs();
			}
		}
	}
};

Renderer.prototype.update_viewport = function()
{
	var c = this.canvas[0];
	
	this.context.viewport(0, 0, c.width, c.height);
};

Renderer.prototype.set_depth_enable = function(on)
{
	var gl = this.context;

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

Renderer.prototype.set_blend_mode = function(mode)
{
	var gl = this.context;
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

		default:
			gl.enable(gl.BLEND);
			gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
			gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			break;
	}
};

function VertexBuffer(gl, v_type)
{
	this.gl = gl;
	this.type = v_type;
	this.buffer = gl.createBuffer();
	this.count = 0;
}

VertexBuffer.vertex_type = 
{
	VERTEX: 0,
	NORMAL: 1,
	COLOR: 2,
	UV0: 3,
	UV1: 4,
	UV2: 5,
	UV3: 6
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

VertexBuffer.prototype.enable = function()
{
	var gl = this.gl;
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
};

VertexBuffer.prototype.bind_data = function(v_data, draw_mode)
{
	var gl = this.gl;

	this.count = (v_data.toString() === '[object ArrayBuffer]' ? v_data.byteLength / 4 : v_data.length) / VertexBuffer.type_stride[this.type];
	this.enable();
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v_data), typeof draw_mode !== 'undefined' ? draw_mode : gl.STATIC_DRAW);
};

VertexBuffer.prototype.bind_to_shader = function(shader)
{
	shader.bind_array(this.type, this.buffer, VertexBuffer.type_stride[this.type]);
};

function IndexBuffer(gl)
{
	this.gl = gl;
	this.buffer = gl.createBuffer();
	this.count = 0;
}

IndexBuffer.prototype.enable = function()
{
	var gl = this.gl;
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
};

IndexBuffer.prototype.bind_data = function(i_data)
{
	var gl = this.gl;
	
	this.count = i_data.length;
	this.enable();
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(i_data), gl.STATIC_DRAW);
};

function Light()
{
	this.type = Light.type.POINT;
	this.diffuse_color = vec4.createFrom(1, 1, 1, 1);
	this.specular_color = vec4.createFrom(1, 1, 1, 1);
	this.position = vec3.createFrom(0, 1, 0);
	this.direction = vec3.createFrom(0, -1, 0);
	this.intensity = 1.0;
}

Light.type = 
{
	POINT: 0,
	DIRECTIONAL: 1,
	COUNT: 2 // Always last!
};

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

function Mesh(gl, prim_type, t_cache, data, base_path, asset_tracker, instances)
{
	this.gl = gl;
	this.prim_type = prim_type;
	this.vertex_buffers = {};
	this.index_buffer = null;
	this.t_cache = t_cache;
	this.material = new Material();
	this.vertex_count = 0;
	this.stream_count = 0;
	this.streams_loaded = 0;
	this.max_prims = null;
	this.instances = instances;
	
	for(var v_type in VertexBuffer.vertex_type)
		this.vertex_buffers[v_type] = null;
		
	if(data)
	{
		var load_stream = function(url, lo, rng, stream, parent)
		{
			var img = new Image();
		
			lo = parseFloat(lo);
			rng = parseFloat(rng);
			
			asset_tracker.signal_started();
		
			img.onload = function(parent) { return function()
			{
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');
				
				canvas.width = img.width;
				canvas.height = img.height;
				
				ctx.imageSmoothingEnabled = false;
				ctx.webkitImageSmoothingEnabled = false;
				ctx.globalCompositeOperation = 'copy';
				
				ctx.drawImage(img, 0, 0);
			
				var pd = ctx.getImageData(0, 0, img.width, img.height);
				var count = pd.width * pd.height;
				var dv = new DataView(pd.data.buffer);
				var ab = new ArrayBuffer(count);
				var abdv = new DataView(ab);
				var data = [];
				
				// Extract the datastream from the canvas RGBA data.
				for(var i = 0, o = 0; o < count; i += 4, o++)
					abdv.setUint8(o, dv.getUint8(i));
				
				// Decode
				for(i = 0; i < count; i+=4)
					data.push(abdv.getFloat32(i, false));
				
				stream.bind_data(data);
			
				parent.vertex_count = count / (4 * 3);
				parent.streams_loaded++;

				msg('INFO: Finished loading stream from ' + img.src + ' with ' + (count / 4) + ' elements. (' + parent.streams_loaded + ' / ' + parent.stream_count + ')');
				asset_tracker.signal_completed();
			}}(parent);
		
			img.onerror = function()
			{
				asset_tracker.signal_failed();
			};
		
			img.onabort = function()
			{
				asset_tracker.signal_failed();
			};

			img.src = base_path + url + '.png';
		};
		
		if(data.vertices)
		{
			this.stream_count++;
			load_stream(data.vertices, data.v_lo, data.v_rng, this.vertex_buffers.VERTEX = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX), this);
		}
		
		if(data.normals)
		{
			this.stream_count++;
			load_stream(data.normals, data.n_lo, data.n_rng, this.vertex_buffers.NORMAL = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL), this);
		}
		
		if(data.uv0)
		{
			this.stream_count++;
  			load_stream(data.uv0, data.uv0_lo, data.uv0_rng, this.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0), this)
		}
		
		if(data.indices)
		{
			var idx = this.index_buffer = new IndexBuffer(gl);
			
			idx.bind_data(data.indices);
		}
	}
}

Mesh.prototype.generate_shader = function()
{
	this.shader = ComposeShader(E2.app.player.core.renderer.shader_cache, this, this.material, null, null, null, null);
}

Mesh.prototype.get_stride = function()
{
	return [1, 2, 2, 2, 3, 3, 3][this.prim_type];
};

Mesh.prototype.render = function(camera, transform, shader, material)
{
	var verts = this.vertex_buffers['VERTEX'];
	var shader = shader || this.shader;
	var gl = this.gl;
	var mat = material ? material : this.material;
	
	if(!verts || !shader || !shader.linked || this.streams_loaded < this.stream_count)
		return;
	
	if(gl.bound_mesh !== this || gl.bound_shader !== this.shader)
	{
		shader.enable();
	
		for(var v_type in VertexBuffer.vertex_type)
		{
			var vb = this.vertex_buffers[v_type];
		
			if(vb)
				vb.bind_to_shader(shader);
		}

		shader.bind_camera(camera);
		shader.apply_uniforms(this, mat);
		gl.bound_shader = shader;
	}
	
	var draw_count = this.index_buffer ? this.index_buffer.count : verts.count;
	
	if(this.max_prims !== null)
	{
		var rd = this.max_prims * this.get_stride();
		
		if(rd < draw_count)
			draw_count = rd;
	}
	
	if(!this.instances)
	{
		shader.bind_transform(transform);
		
		if(!this.index_buffer)
		{
			gl.drawArrays(this.prim_type, 0, draw_count);
		}
		else
		{
			if(gl.bound_mesh !== this)
				this.index_buffer.enable();
			
			gl.drawElements(this.prim_type, draw_count, gl.UNSIGNED_SHORT, 0);
		}
	}
	else
	{
		var inst = this.instances;
		var ft = mat4.create();
		
		if(!this.index_buffer)
		{
			for(var i = 0, len = inst.length; i < len; i++)
			{
				if(!transform.invert)
					mat4.multiply(transform, inst[i], ft);
				else
					mat4.multiply(inst[i], transform, ft);
				
				shader.bind_transform(ft);
				gl.drawArrays(this.prim_type, 0, draw_count);
			}
		}
		else
		{
			this.index_buffer.enable();

			for(var i = 0, len = inst.length; i < len; i++)
			{
				if(!transform.invert)
					mat4.multiply(transform, inst[i], ft);
				else
					mat4.multiply(inst[i], transform, ft);
			
				shader.bind_transform(ft);
				gl.drawElements(this.prim_type, draw_count, gl.UNSIGNED_SHORT, 0);
			}
		}
	}

	gl.bound_mesh = this;
};

function ComposeShader(cache, mesh, material, uniforms_vs, uniforms_ps, vs_custom, ps_custom)
{
	var gl = E2.app.player.core.renderer.context;
	var streams = [];
	var v_types = VertexBuffer.vertex_type;
	var has_lights = false;
	var lights = material ? material.lights : mesh.material.lights;
	var tt = Material.texture_type;
	
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
			vs_src.push(uniforms_vs);
	
		ps_src.push('precision lowp float;');
		ps_src.push('uniform vec4 a_col;');
		ps_src.push('varying vec4 f_col;');
		
		if(uniforms_ps)
			ps_src.push(uniforms_ps);
	
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

			if(streams[v_types.COLOR])
				shader.v_col = resolve_attr('v_col');
		
			if(streams[v_types.UV0])
			{
				if(d_tex)
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

function Shader(gl, type, src)
{
	this.shader = gl.createShader(type);
	this.compiled = false;
	this.linked = false;
	this.compile_info = ''
	this.link_info = ''
	
	try
	{
		gl.shaderSource(this.shader, src);
	}
	catch(e)
	{
		msg('ERROR: Shader source invalid: ' + e);
		return;
	}
	
	gl.compileShader(this.shader);
	
	if(!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS))
	{
		var info = gl.getShaderInfoLog(this.shader);
		var info_lines = info.split('\n');
		var src_lines = src.split('\n');
		
		this.compile_info = info;
		msg('ERROR: Shader compilation failed:\n');	
		
		for(var l = 0, len = info_lines.length; l != len; l++)
		{
			var line_str = info_lines[l];
			var tokens = line_str.split(':');
			
			msg(line_str + '\n\t>>> ' + src_lines[parseInt(tokens[2])-1]);
		}
		
	}
	else
		this.compiled = true;
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
	
	return [tex, this.get_tex_param(mat, mesh_mat, 'uv_offsets', type), this.get_tex_param(mat, mesh_mat, 'uv_scales', type)];
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

function Camera(gl)
{
	this.projection = mat4.create();
	this.view = mat4.create();
	
	mat4.identity(this.projection);
	mat4.identity(this.view);
}
	
function Scene(gl, core, data, base_path)
{
	this.gl = gl;
	this.texture_cache = E2.app.player.core.renderer.texture_cache;
	this.shader_cache = E2.app.player.core.renderer.shader_cache;
	this.meshes = [];
	this.materials = {};
	this.id = 'n/a';
	this.vertex_count = 0;
	this.core = core;
	this.bounding_box = null;
	
	this.init_bb();
	
	if(data)
		this.load_json(data, base_path);
};

Scene.prototype.init_bb = function(data)
{
	if(!data || !data.bounding_box)
	{
		this.bounding_box = { "lo": vec3.createFrom(0.0, 0.0, 0.0), "hi": vec3.createFrom(0.0, 0.0, 0.0) };
		return;
	}

	data.bounding_box.lo = vec3.create(data.bounding_box.lo);
	data.bounding_box.hi = vec3.create(data.bounding_box.hi);
	
	this.bounding_box = data.bounding_box;
}

Scene.prototype.load_json = function(data, base_path)
{
	var gl = this.gl;
	
	this.id = data.id;
	this.init_bb(data);
	 
	for(var id in data.materials)
	{
		if(!data.materials.hasOwnProperty(id))
			continue;
		
		this.materials[id] = new Material(gl, this.texture_cache, data.materials[id], base_path);
	}
	
	for(var id in data.meshes)
	{
		if(!data.meshes.hasOwnProperty(id))
			continue;
			
		var m = data.meshes[id];
		
		for(var b = 0, len = m.batches.length; b < len; b++)
		{
			var batch = m.batches[b];
			var mesh = new Mesh(gl, gl.TRIANGLES, this.texture_cache, batch, base_path, this.core.asset_tracker, m.instances);
		
			mesh.id = id + '_b' + b;
			mesh.material = this.materials[batch.material];
			mesh.shader = ComposeShader(this.shader_cache, mesh, mesh.material, null, null, null, null);
		
			this.meshes.push(mesh);
			this.vertex_count += mesh.vertex_count;
		}
	}
};

Scene.prototype.render = function(gl, camera, transform, overload_shaders, material)
{
	var meshes = this.meshes;
	
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK); 
	gl.enable(gl.DEPTH_TEST);
	gl.depthMask(true);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.BLEND);
	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	if(overload_shaders)
	{
		for(var i = 0, len = meshes.length; i < len; i++)
			meshes[i].render(camera, transform, overload_shaders[i], material);
	}
	else
	{
		for(var i = 0, len = meshes.length; i < len; i++)
		{
			var m = meshes[i];
		
			m.render(camera, transform, m.shader, material);
		}
	}
};

Scene.prototype.build_overload_shaders = function(material)
{
	var s_cache = this.shader_cache;
	var meshes = this.meshes;
	var o_shaders = [];
	
	for(var i = 0, len = meshes.length; i < len; i++)
	{
		var mesh = meshes[i];
		var cached = s_cache.get(Material.get_caps_hash(mesh, material));
		
		if(cached)
			o_shaders[i] = cached;
		else
			o_shaders[i] = ComposeShader(s_cache, mesh, material, null, null, null, null);
	}
	
	return o_shaders;
};

Scene.prototype.create_autofit_camera = function()
{
	var bb = this.bounding_box;
	var cam = new Camera();
	
	// If we have no bounding box, default to the old-fashioned 
	//screenspace cam in lieu of something better.
	if(!bb)
		return cam;
	
	var c = E2.app.player.core.renderer.canvas;
	var pos = [bb.hi[0] * 3.0, bb.hi[1] * 3.0, bb.hi[2] * 3.0];
	var d = vec3.create(), tar = vec3.create();
	
	vec3.subtract(bb.hi, bb.lo, d);
	
	var dist = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] + d[2]) * 8.0;
	
	vec3.add(bb.lo, vec3.scale(d, 0.5, tar), tar);
	
	pos[0] = tar[0];
	
	msg('INFO: New autofit camera: ' + pos + ' ... ' + tar[0] + ',' + tar[1] + ',' + tar[2] + ' ... ' + dist);
	
	mat4.perspective(45.0, c.width() / c.height(), 1.0, 1.0 + dist, cam.projection);
	mat4.lookAt(pos, tar, vec3.createFrom(0, 0, 1), cam.view);
	
	return cam;
};
	
Scene.load = function(gl, url, core)
{
	// Create dummy imposter scene and can be used as a null-proxy until asynchronous load completes.
	var scene = new Scene(gl, core, null, null);
	
	core.asset_tracker.signal_started();
	
	jQuery.ajax({
		url: url, 
		dataType: 'json',
		success: function(scene, c) { return function(data) 
		{
			var bp = url.substr(0, url.lastIndexOf('/') + 1);
			var r = c.renderer;
			
			scene.load_json(data, bp);
			msg('INFO: Scene - Finished loading assets from "' + bp + '". Meshes: ' + scene.meshes.length + ', Shaders: ' + scene.shader_cache.count() + ', Textures: ' + scene.texture_cache.count() + ', Vertices: ' + scene.vertex_count);
			msg('INFO: Global cache state: ' + r.texture_cache.count() + ' textures. ' + r.shader_cache.count() + ' shaders.');
			c.asset_tracker.signal_completed();
		}}(scene, core),
		error: function(c) { return function(jqXHR, textStatus, errorThrown)
		{
			msg('ERROR: Failed to load scene "' + url + '": ' + textStatus + ', ' + errorThrown, 'Renderer');
			c.asset_tracker.signal_failed();
		}}(core),
		async: true // TODO: We should definitely change this to be asynchronous!
	});
	
	return scene;
};

