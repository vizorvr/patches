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

	var fqdn = '/* @echo FQDN */'; // Fill in FQDN (fully qualified domain name) from gulpfile for the player.
	// gulp-preprocess replaces above with the string 'undefined' if gulpfile didn't provide the FQDN for some reason.
	// Inside the editor, the string replace is not evaluated so we need to check against the preprocessing string as well.
	if(fqdn === 'undefined' || fqdn === '/* @echo FQDN */') fqdn = 'create.vizor.io'; // defaulting to create.vizor.io
	this.default_tex.load('//'+fqdn+'/images/no_texture.png', core);

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

function Camera(gl)
{
	this.projection = mat4.create();
	this.view = mat4.create();

	mat4.identity(this.projection);
	mat4.identity(this.view);
}

if (typeof(module) !== 'undefined') {
	module.exports.VertexBuffer = VertexBuffer
	module.exports.IndexBuffer = IndexBuffer
}
