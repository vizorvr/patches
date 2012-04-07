function Texture(gl)
{
	var self = this;
	
	this.gl = gl;
    	this.min_filter = gl.LINEAR;
	this.mag_filter = gl.LINEAR;
	this.texture = gl.createTexture();
	this.width = 0;
	this.height = 0;
	
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
}

function Renderer(canvas_id)
{
	var self = this;
	
	if(!window.WebGLRenderingContext)
		window.location = 'http://get.webgl.org';

	// TODO: Remove this. Refactor to use the copy in VertexBuffer instead.
	this.array_type = 
	{
		VERTEX: 0,
		COLOR: 1,
		UV0: 2,
		UV1: 3,
		UV2: 4,
		UV3: 5
	};

	this.blend_mode = 
	{
		NONE: 0,
		ADDITIVE: 1,
		SUBTRACTIVE: 2,
		MULTIPLY: 3,
		NORMAL: 4
	};
	
  	this.canvas_id = canvas_id;
	this.canvas = $(canvas_id);
	
	this.context = this.canvas[0].getContext('experimental-webgl', { alpha: false });
	
	if(!this.context)
		window.location = 'http://get.webgl.org';

	if(false)
		this.context = WebGLDebugUtils.makeDebugContext(this.context);
	
	if(!this.context)
		msg('Error: WebGL initialization failed.');
		
	this.texture_cache = new TextureCache(this.context);
	
	this.update = function()
	{
		if(this.context)
		{
			var gl = self.context;
			
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.enable(gl.BLEND);
			gl.disable(gl.DEPTH_TEST);
			gl.depthMask(false);
	    		// gl.viewport(0, 0, self.canvas[0].clientWidth, self.canvas[0].clientHeight);
	    		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}	
	};
	
	this.set_depth_enable = function(on)
	{
		var gl = self.context;

		if(on)
		{
			gl.enable(gl.DEPTH_TEST);
			gl.depthMask(true);
			return;
		}

		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);
	};
	
	this.set_blend_mode = function(mode)
	{
		var gl = self.context;
		var bm = self.blend_mode;
		
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

function Mesh(gl, prim_type)
{
	var self = this;
	
	this.prim_type = prim_type;
	this.vertex_buffers = {}; // VertexBuffer.vertex_type
	this.index_buffer = null;
	
	for(var v_type in VertexBuffer.vertex_type)
		this.vertex_buffers[v_type] = null;
		
	this.generate_shader = function()
	{
		var flags = [];
		var v_types = VertexBuffer.vertex_type;
		
		for(var v_type in v_types)
		{
			var index = v_types[v_type];
			
			flags[index] = this.vertex_buffers[v_type] !== null;
		}
		
		var vs_src = [];
		var ps_src = [];
		
		vs_src.push('attribute vec3 v_pos;');
		vs_src.push('uniform vec4 color;');
		vs_src.push('varying lowp vec4 f_col;');
		ps_src.push('varying lowp vec4 f_col;');
		
		if(flags[v_types.COLOR])
			vs_src.push('attribute vec4 v_col;');
		
		if(flags[v_types.UV0])
		{
			vs_src.push('attribute vec2 v_uv0;');
			vs_src.push('varying mediump vec2 f_uv0;');
			ps_src.push('varying mediump vec2 f_uv0;');
		}

		vs_src.push('uniform mat4 m_mat;');
		vs_src.push('uniform mat4 v_mat;');
		vs_src.push('uniform mat4 p_mat;');
		
		vs_src.push('void main(void) {');		
		vs_src.push('    vec4 dc = color;');		
		vs_src.push('    gl_Position = p_mat * v_mat * m_mat * vec4(v_pos, 1.0);');		

		if(flags[v_types.COLOR])
			vs_src.push('    dc = dc * v_col;');		

		if(flags[v_types.UV0])
			vs_src.push('    f_uv0 = v_uv0;');		

		vs_src.push('    f_col = dc;');		
		vs_src.push('}');

		if(flags[v_types.UV0])
				ps_src.push('uniform sampler2D tex0;');

		ps_src.push('void main(void) {');		
		ps_src.push('    mediump vec4 fc = f_col;');

		if(flags[v_types.UV0])
			ps_src.push('    fc = fc * texture2D(tex0, f_uv0.st);');
			
		ps_src.push('    gl_FragColor = fc;');
		// ps_src.push('    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);');
		ps_src.push('}');
		
		vs_src = vs_src.join('\n');
		ps_src = ps_src.join('\n');
		
		var s = new ShaderProgram(gl);
		var vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
		var ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);
		
		var prog = s.program;
	
		s.attach(vs);
		s.attach(ps);
		s.link();
	
		s.vertexPosAttribute = gl.getAttribLocation(prog, "v_pos");
		s.mMatUniform = gl.getUniformLocation(prog, "m_mat");
		s.vMatUniform = gl.getUniformLocation(prog, "v_mat");
		s.pMatUniform = gl.getUniformLocation(prog, "p_mat");
		s.diffuseColorUniform = gl.getUniformLocation(prog, "color");

		if(flags[v_types.COLOR])
			s.vertexColAttribute = gl.getAttribLocation(prog, "v_col");

		if(flags[v_types.UV0])
		{
			s.uv0CoordAttribute = gl.getAttribLocation(prog, "v_uv0");
			s.tex0Uniform = gl.getUniformLocation(prog, "tex0");
		}

		// Note: Shader implementations must decorate the shader prototype with these
		// two methods, so the rendering plugins can call it to update the shader uniforms
		// and bind vertex data at the appropriate point in its rendering logic. It also
		// means that the rendering logic is kept independent of the renderer logic:
		// if an array type in unknown by the shader, but requested by the renderer,
		// the request can be silently droppred, which gives us a nice weak API.
		s.bind_array = function(type, data, item_size)
		{
			var types = VertexBuffer.vertex_type;
			var attr = null;
			
			if(type === types.VERTEX)
				attr = this.vertexPosAttribute;
			else if(type === types.COLOR)
				attr = this.vertexColAttribute;
			else if(type === types.UV0)
				attr = this.uv0CoordAttribute;
			else
				return;
				
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.enableVertexAttribArray(attr);
			gl.vertexAttribPointer(attr, item_size, gl.FLOAT, false, 0, 0);
		}
		
		// Must be decorated by the caller with an appropriate implementation of
		// apply_uniforms() that pipes data to the generated shader by mapping input
		// values to stored shader uniform / attribute locations.
		return s;
	}
}

function Color(r, g, b, a)
{
	this.rgba = [r, g, b, a || 1.0];
}

function Shader(gl, type, src)
{
	this.shader = gl.createShader(type);
	
	gl.shaderSource(this.shader, src);
	gl.compileShader(this.shader);
	
	if(!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS))
		msg('Shader compilation failed:\n' + gl.getShaderInfoLog(this.shader));
}

function ShaderProgram(gl)
{
	var self = this;
	
	this.gl = gl;
	this.program = gl.createProgram();

	this.attach = function(shader)
	{
		self.gl.attachShader(self.program, shader.shader);
	};
	
	this.link = function()
	{
		self.gl.linkProgram(self.program);

		if(!self.gl.getProgramParameter(self.program, gl.LINK_STATUS))
      			msg('Shader linking failed:\n' + gl.getProgramInfoLog(self.program));
		
		gl.validateProgram(self.program);
		
		if(!gl.getProgramParameter(self.program, gl.VALIDATE_STATUS))
      			msg('Shader validation failed:\n' + gl.getProgramInfoLog(self.program));
      	};
      	
      	this.enable = function()
      	{
		self.gl.useProgram(self.program);
      	}
}

function Camera(gl)
{
	var self = this;
	
	this.gl = gl;
	this.projection = mat4.create();
	this.view = mat4.create();
	
	mat4.identity(this.projection);
	mat4.identity(this.view);
}

