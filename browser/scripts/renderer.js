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
	var that = this;

	this.vr_hmd = vr_devices[0];
	this.vr_sensor = vr_devices[1];
	this.canvas_id = canvas_id;
	this.canvas = $(canvas_id);
	this.framebuffer_stack = [];
	this.def_ambient = vec4.createFrom(0, 0, 0, 1);
	this.def_diffuse = vec4.createFrom(1, 1, 1, 1);
	this.def_specular = vec4.createFrom(1, 1, 1, 1);
	this.up_vec = vec3.createFrom(0, 0, 1);
	this.fs_listeners = [];
	this._listeners = {};
	
	this.org_width = this.canvas.width();
	this.org_height = this.canvas.height();
	
	this.screenshot = 
	{ 
		pending: false,
		width: 512,
		height: 256,
		framebuffer: null,
		renderbuffer: null,
		texture: null,
		pixels: null
	};

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
	{
		debugger;
	}
	
	this.extensions = new Extensions(this.context);
	this.texture_cache = new TextureCache(this.context, core);
	this.shader_cache = new ShaderCache(this.context);
	this.fullscreen = false;
	this.default_tex = new Texture(this);
	this.default_tex.load('/images/no_texture.png', core);

	var resizeTimer;
	$(window).on('resize', function() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(that.onResize.bind(that), 200);
	});

	document.addEventListener('fullscreenchange', this.on_fullscreen_change.bind(this));
	document.addEventListener('webkitfullscreenchange', this.on_fullscreen_change.bind(this));
	document.addEventListener('mozfullscreenchange', this.on_fullscreen_change.bind(this));
	
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

Renderer.prototype.on = function(kind, cb)
{
	if (!cb)
		return;

	if (!this._listeners[kind])
		this._listeners[kind] = [];

	this._listeners[kind].push(cb);
}

Renderer.prototype.off = function(kind, cb)
{
	this._listeners[kind] = this._listeners.filter(function(c) {
		return c !== cb;
	});
}

Renderer.prototype.emit = function(kind)
{
	if (!this._listeners[kind])
		return;

	this._listeners[kind].forEach(function(cb) {
		cb();
	});
};

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
		
		// Do we need to capture the next frame as a screenshot?
		var ss = this.screenshot;
		
		if(ss.pending)
		{
			var fb = ss.framebuffer = gl.glCreateFramebuffer();
			var t = gl.glCreateTexture();

			gl.bindTexture(gl.TEXTURE_2D, t);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ss.width, ss.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

			var rb = this.screenshot.renderbuffer = gl.createRenderbuffer();
		
			gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, ss.width, ss.height);

			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);

			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.viewport(0, 0, ss.width, ss.height);
			
			ss.texture = new Texture(gl, t, gl.LINEAR);
		}

		// this.update_viewport();
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}	
};

Renderer.prototype.end_frame = function()
{
	var gl = this.context;
	
	if(gl)
	{
		gl.flush();
	
		// Did we render this frame as a screenshot? If so, store the results.
		var ss = this.screenshot;
		
		if(ss.pending)
		{
			var c = this.canvas[0];
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, c.width, c.height);
			
			// Grab the framebuffer data and store it store it as RGBA
			var data = new Uint8Array(ss.width * ss.height * 4);
			
			gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, this.img_data);
			
			// Drop the frame-, renderbuffer and texture.
			gl.deleteFramebuffer(ss.framebuffer);
			gl.deleteRenderbuffer(ss.renderbuffer);
			ss.texture.drop();
			
			ss.framebuffer = null;
			ss.renderbuffer = null;
			ss.texture = null;
			ss.pending = false;

			// Ditch the alpha channel and store
			var p = ss.pixels = new Uint8Array(ss.width * ss.height * 3);
	
			for(var i = 0, o = 0; i < w * h * 3; i += 3, o += 4)
			{
				p[i] = data[o];
				p[i+1] = data[o+1];
				p[i+2] = data[o+2];
			}
		}
	}
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

Renderer.prototype.add_fs_listener = function(delegate)
{
	if(this.fs_listeners.indexOf(delegate) === -1)
		this.fs_listeners.push(delegate);
};

Renderer.prototype.remove_fs_listener = function(delegate)
{
	var idx = this.fs_listeners.indexOf(delegate);
	
	if(idx !== -1)
		this.fs_listeners.splice(idx, 1);
};

Renderer.prototype.onResize = function()
{
	var c = E2.dom.webgl_canvas;

	if (this.fullscreen)
	{
		var width = window.innerWidth;
		var height = window.innerHeight;

		c[0].width = width;
		c[0].height = height;

		E2.dom.webgl_canvas.css('width', width);
		E2.dom.webgl_canvas.css('height', height);
	}

	this.update_viewport();

	this.emit('resize');
}

Renderer.prototype.on_fullscreen_change = function()
{
	var c = E2.dom.webgl_canvas;

	if (!this.fullscreen)
	{
		this.fullscreen = true;
		c.removeClass('webgl-canvas-normal');
		c.addClass('webgl-canvas-fs');
	}
	else 
	{
		this.fullscreen = false;
		c.removeClass('webgl-canvas-fs');
		c.addClass('webgl-canvas-normal');
		c.css('width', this.org_width + 'px');
		c.css('height',this.org_height + 'px');
		c[0].width = this.org_width;
		c[0].height = this.org_height;
	}

	this.fs_listeners.forEach(function(cb) {
		cb(this.fullscreen);
	});
};

Renderer.prototype.set_fullscreen = function(state)
{
	var c = E2.dom.webgl_canvas;
	var cd = c[0];
	var that = this;

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
		
			c.removeClass('webgl-canvas-normal');
			c.addClass('webgl-canvas-fs');
		}
	}
	else
	{
		if(this.fullscreen)
		{
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
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

		    img.crossOrigin = "Anonymous";
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
		async: false // TODO: We should definitely change this to be asynchronous!
	});
	
	return scene;
};

