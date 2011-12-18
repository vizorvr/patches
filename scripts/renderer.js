function Renderer(canvas_id)
{
	var self = this;
	
	if(!window.WebGLRenderingContext)
		window.location = 'http://get.webgl.org';

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
      	
      	// TODO: Resume from: https://github.com/gpjt/webgl-lessons/blob/35a02ac2360da4d1e3a9d6fa389832711b0c8d84/lesson01/index.html
      	this.enable = function()
      	{
		self.gl.useProgram(self.program);
      	}
}
