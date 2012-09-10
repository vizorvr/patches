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
			msg('ERROR: Failed loading texture \'' + src + '\'.');
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
	this.framebuffer_stack = [];
		
	try
	{
		this.context = this.canvas[0].getContext('experimental-webgl', { alpha: false, preserveDrawingBuffer: false, antialias: true });
	}
	catch(e)
	{
		this.context = null;
	}
	
	if(!this.context)
		window.location = 'http://get.webgl.org';

	if(false)
		this.context = WebGLDebugUtils.makeDebugContext(this.context);
	
	this.texture_cache = new TextureCache(this.context);
	
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
	
	this.update_viewport = function(w, h)
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

function Mesh(gl, prim_type, t_cache, data, base_path)
{
	var self = this;
	
	this.prim_type = prim_type;
	this.vertex_buffers = {}; // VertexBuffer.vertex_type
	this.index_buffer = null;
	this.t_cache = t_cache;
	this.material = {};
	this.vertex_count = 0;
	
	for(var v_type in VertexBuffer.vertex_type)
		this.vertex_buffers[v_type] = null;
		
	if(data)
	{
		var m = data.material;
		
		var parse_color = function(name)
		{
			var c = m[name];
			
			if(c)
				self.material[name] = new Color(c[0], c[1], c[2], c[3]);
		};
		
		var parse_tex = function(name)
		{
			var t = m[name];
			
			if(t)
				self.material[name] = t_cache.get(base_path + t);
		};
		
		// Load material, if any
		if(m)
		{
			parse_color('diffuse_color');
			parse_color('emission_color');
			parse_color('specular_color');
			parse_color('ambient_color');
			parse_tex('diffuse_tex');
			parse_tex('emission_tex');
			parse_tex('specular_tex');
			parse_tex('normal_tex');		 

			this.material.shininess = data.shininess ? data.shininess : 0.0;
			this.material.double_sided = data.double_sided ? true : false;
		}
		
		if(data.verts)
		{
			var verts = this.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX);
		
			self.vertex_count = data.verts.length / 3;
			verts.bind_data(data.verts);
		}

		if(data.norms)
		{
			var norms = this.vertex_buffers['NORMAL'] = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL);
		
			norms.bind_data(data.norms);
		}

		if(data.uv0)
		{
  			var uv0 = this.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0);
		
			uv0.bind_data(data.uv0);
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
       		shader.apply_uniforms();
		
		var draw = (!self.index_buffer) ? function()
		{
			gl.drawArrays(self.prim_type, 0, verts.count);
		} : function()
		{
			self.index_buffer.enable();
			gl.drawElements(self.prim_type, self.index_buffer.count, gl.UNSIGNED_SHORT, 0);
		};
		
		if(!self.instances)
		{
			shader.bind_transform(transform);	
			draw();
		}
		else
		{
			var inst = self.instances;
			var ft = mat4.create();
			
			for(var i = 0, len = inst.length; i < len; i++)
			{
				mat4.multiply(inst[i], transform, ft);
				shader.bind_transform(ft);	
				draw();
			}
		}
	};

	this.generate_shader = function(shader_cache, custom_vs_src, custom_ps_src)
	{
		// TODO: Adapt shader to handle the remaining maps and material attributes.
		var flags = [];
		var v_types = VertexBuffer.vertex_type;
		
		for(var v_type in v_types)
		{
			var index = v_types[v_type];
			
			flags[index] = self.vertex_buffers[v_type] !== null;
		}
		
		var exists = false;
		var ext_prog = null;
				
		if(shader_cache)
		{
			var cached = shader_cache.get(self.material);
			
			exists = cached[0];
			ext_prog = cached[1]; 
		}
		
		var s = new ShaderProgram(gl, ext_prog);
			
		if(!exists)
		{
			var vs_src = [];
			var ps_src = [];
		
			vs_src.push('attribute vec3 v_pos;');
			vs_src.push('uniform vec4 color;');
			vs_src.push('varying lowp vec4 f_col;');
			ps_src.push('varying lowp vec4 f_col;');
		
			if(flags[v_types.COLOR])
				vs_src.push('attribute vec4 v_col;');
		
			if(flags[v_types.NORMAL])
			{
				vs_src.push('attribute vec3 v_norm;');
				vs_src.push('varying mediump vec3 f_norm;');
				ps_src.push('varying mediump vec3 f_norm;');
			}
			
			if(flags[v_types.UV0])
			{
				vs_src.push('attribute vec2 v_uv0;');
				vs_src.push('varying mediump vec2 f_uv0;');
				ps_src.push('varying mediump vec2 f_uv0;');
			}

			vs_src.push('uniform mat4 m_mat;');
			vs_src.push('uniform mat4 v_mat;');
			vs_src.push('uniform mat4 p_mat;');
		
			if(!custom_vs_src)
			{
				vs_src.push('void main(void) {');		
				vs_src.push('    vec4 dc = color;');		
				vs_src.push('    gl_Position = p_mat * v_mat * m_mat * vec4(v_pos, 1.0);');		

				if(flags[v_types.COLOR])
					vs_src.push('    dc = dc * v_col;');		

				if(flags[v_types.NORMAL])
					vs_src.push('    f_norm = v_norm;');

				if(flags[v_types.UV0])
					vs_src.push('    f_uv0 = v_uv0;');		

				vs_src.push('    f_col = dc;');		
				vs_src.push('}');
			}
			else
				vs_src.push(custom_vs_src);		
			
			if(flags[v_types.UV0])
					ps_src.push('uniform sampler2D tex0;');

			if(!custom_ps_src)
			{
				ps_src.push('void main(void) {');		
				ps_src.push('    mediump vec4 fc = f_col;');

				if(flags[v_types.UV0])
					ps_src.push('    fc = fc * texture2D(tex0, f_uv0.st);');
			
				ps_src.push('    if(fc.a < 0.5) discard;');
				ps_src.push('    gl_FragColor = fc;');
				ps_src.push('}');
			}
			else
				ps_src.push(custom_ps_src);		

			vs_src = vs_src.join('\n');
			ps_src = ps_src.join('\n');
		
			// TODO: For debugging. Remove!
			/*s.vs_src = vs_src;
			s.ps_src = ps_src;*/
		
			var vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
			var ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);
		
			s.attach(vs);
			s.attach(ps);
			s.link();
		}
	
		var prog = s.program;
	
		s.vertexPosAttribute = gl.getAttribLocation(prog, "v_pos");
		s.vertexNormAttribute = gl.getAttribLocation(prog, "v_norm");
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
			else if(type === types.NORMAL)
				attr = this.vertexNormAttribute;
			else if(type === types.COLOR)
				attr = this.vertexColAttribute;
			else if(type === types.UV0)
				attr = this.uv0CoordAttribute;
			else
				return;
			
			 // This can happen if the symbol is declared but unused. Some
			 // drivers optimize the shaders and eliminate dead code.
			if(attr === -1)
				return;
			
			gl.bindBuffer(gl.ARRAY_BUFFER, data);
			gl.enableVertexAttribArray(attr);
			gl.vertexAttribPointer(attr, item_size, gl.FLOAT, false, 0, 0);
		};
		
		s.apply_uniforms = function()
		{
			var m = self.material;
			
			gl.enableVertexAttribArray(this.vertexPosAttribute);

			if(m.diffuse_color)
				gl.uniform4fv(this.diffuseColorUniform, new Float32Array(m.diffuse_color.rgba));	
			else
				gl.uniform4fv(this.diffuseColorUniform, new Float32Array([1.0, 1.0, 1.0, 1.0]));	
					
			if(m.diffuse_tex && this.uv0CoordAttribute !== undefined)
			{
				gl.enableVertexAttribArray(this.uv0CoordAttribute);
				gl.uniform1i(this.tex0Uniform, 0);
				m.diffuse_tex.enable(gl.TEXTURE0);
			}
			
			if(m.double_sided)
				gl.disable(gl.CULL_FACE);
			else
				gl.enable(gl.CULL_FACE);
		};
		
		// Can be monkey-patched by the caller with an appropriate implementation of
		// apply_uniforms() that pipes data to the generated shader by mapping input
		// values to stored shader uniform / attribute locations, if the default
		// generated here won't suffice.
		
		return s;
	}
}

function Color(r, g, b, a)
{
	this.rgba = [r, g, b, a || 1.0];
}

function ShaderCache(gl)
{
	var self = this;
	
	this.programs = {};
	
	this.build_key = function(m)
	{
		var k = '';
		
		k += m.diffuse_color ? '1' : '0';
		k += m.emission_color ? '1' : '0';
		k += m.specular_color ? '1' : '0';
		k += m.ambient_color ? '1' : '0';
		k += m.diffuse_tex ? '1' : '0';
		k += m.emission_tex ? '1' : '0';
		k += m.specular_tex ? '1' : '0';
		k += m.normal_tex ? '1' : '0';
		k += m.shininess ? '1' : '0';
		k += m.double_sided ? '1' : '0';
	
		return k;
	};
	
	this.get = function(mat)
	{
		var key = self.build_key(mat);
		var exists = key in self.programs;
		var prog = null;
		
		if(exists)
			prog = self.programs[key];
		else
			self.programs[key] = prog = gl.createProgram();
		
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
		msg('ERROR: Shader compilation failed:\n' + gl.getShaderInfoLog(this.shader) + '\n' + src + '\n\n');
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
      			msg('ERROR: Shader linking failed:\n' + gl.getProgramInfoLog(self.program));
		
		gl.validateProgram(self.program);
		
		if(!gl.getProgramParameter(self.program, gl.VALIDATE_STATUS))
      			msg('ERROR: Shader validation failed:\n' + gl.getProgramInfoLog(self.program));
      	};
      	
      	this.enable = function()
      	{
		self.gl.useProgram(self.program);
      	};

	this.bind_camera = function(camera)
	{
		gl.uniformMatrix4fv(self.vMatUniform, false, camera.view);
		gl.uniformMatrix4fv(self.pMatUniform, false, camera.projection);
	};
	
	this.bind_transform = function(transform)
	{
		gl.uniformMatrix4fv(self.mMatUniform, false, transform);
	};
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
	
function Scene(gl, data, base_path)
{
	var self = this;
	
	this.gl = gl;
	this.texture_cache = new TextureCache(gl);
	this.shader_cache = new ShaderCache(gl);
	this.meshes = [];
	this.id = 'n/a';
	this.vertex_count = 0;

	if(data)
	{
		this.id = data.id;
		
		this.bounding_box = data.bounding_box || { "lo": [0.0, 0.0, 0.0], "hi": [0.0, 0.0, 0.0] };
		 
		for(var i = 0, len = data.meshes.length; i < len; i++)
		{
			var mesh = new Mesh(gl, gl.TRIANGLES, this.texture_cache, data.meshes[i], base_path);
			
			mesh.shader = mesh.generate_shader(self.shader_cache);
			this.meshes.push(mesh);
			this.vertex_count += mesh.vertex_count;
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
			
			scene = new Scene(gl, data, bp);
			msg('Scene: Finished loading assets from "' + bp + '". Meshes: ' + scene.meshes.length + ', Shaders: ' + scene.shader_cache.count() + ', Textures: ' + scene.texture_cache.count() + ', Vertices: ' + scene.vertex_count);
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			msg('ERROR: Scene: Failed to load "' + url + '": ' + textStatus + ', ' + errorThrown);
		},
		async:   false
	});
	
	return scene;
};

