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
	this.canvas = $(canvas_id);
	
	this.context = this.canvas[0].getContext('experimental-webgl');
	
	if(!this.context)
		window.location = 'http://get.webgl.org';

	if(false)
		this.context = WebGLDebugUtils.makeDebugContext(this.context);
	
	if(!this.context)
		msg('Error: WebGL initialization failed.');
		
	this.update = function()
	{
		if(this.context)
		{
			var gl = self.context;
			
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
	    		// gl.viewport(0, 0, self.canvas[0].clientWidth, self.canvas[0].clientHeight);
	    		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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

function Camera(gl)
{
	var self = this;
	
	this.gl = gl;
	this.projection = mat4.create();
	this.view = mat4.create();
	
	mat4.identity(this.projection);
	mat4.identity(this.view);
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
			msg('NOTE: Loaded texture \'' + src + '\'.');
			self.upload(img, src);
		};
		
		img.src = src + '?d=' + Math.random();	
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

