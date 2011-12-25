function Renderer(canvas_id)
{
	var self = this;
	
	if(!window.WebGLRenderingContext)
		window.location = 'http://get.webgl.org';

	this.array_type = 
	{
		VERTEX: 0,
		COLOR: 1,
		UV0: 2,
		UV1: 3,
		UV2: 4,
		UV3: 5
	};

  	this.canvas_id = canvas_id;
	
	var canvas = $(canvas_id);

	this.context = canvas[0].getContext('experimental-webgl');
	
	if(!this.context)
		window.location = 'http://get.webgl.org';

	if(false) // Use debugging context? Caution: Causes trouble on Chrome...
		this.context = WebGLDebugUtils.makeDebugContext(this.context);
	
	if(this.context)
	{
		this.context.viewportWidth = 0;
		this.context.viewportHeight = 0;
		this.p_mat = mat4.create();
		this.m_mat = mat4.create();
	}
	else
		msg('Error: WebGL initialization failed.');
		
	this.update = function()
	{
		if(this.context)
		{
			self.context.viewportWidth = canvas.width();
			self.context.viewportHeight = canvas.height();
			
			mat4.perspective(45, self.context.viewportWidth / self.context.viewportHeight, 0.1, 100.0, self.p_mat);
			mat4.identity(self.m_mat);
			mat4.translate(self.m_mat, [0.0, 0.0, -7.0]);
		}	
	};
}

function Color(r, g, b, a)
{
	this.rgba = [r, g, b, a];
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
			self.upload(img);
		};
		
		img.src = src;	
	};
	
	this.enable = function(stage)
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.min_filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.mag_filter);
	};
	
	this.disable = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	
	this.upload = function(img)
	{
		this.width = img.width;
		this.height = img.height;

		self.enable();
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    		self.disable();
	};
	
	this.set_filtering = function(down, up)
	{
	    	this.min_filter = down;
		this.mag_filter = up;
	};
}

