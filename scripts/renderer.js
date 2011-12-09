function Renderer(canvas_id)
{
	if(!window.WebGLRenderingContext)
		window.location = 'http://get.webgl.org';

  	this.canvas_id = canvas_id;
	
	var canvas = $(canvas_id);

	this.context = WebGLDebugUtils.makeDebugContext(canvas[0].getContext('experimental-webgl'));
	
	if(this.context)
	{
		this.context.viewportWidth = canvas.width();
		this.context.viewportHeight = canvas.height();
		this.p_mat = mat4.create();
		this.m_mat = mat4.create();
	
		mat4.perspective(45, this.context.viewportWidth / this.context.viewportHeight, 0.1, 100.0, this.p_mat);
		mat4.identity(this.m_mat);	
	}
	else
		msg('Error: WebGL initialization failed.');
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
      			msg('Shader linking failed.');
      	};
      	
      	// TODO: Resume from: https://github.com/gpjt/webgl-lessons/blob/35a02ac2360da4d1e3a9d6fa389832711b0c8d84/lesson01/index.html
      	this.enable = function()
      	{
		self.gl.useProgram(self.program);
      	}
}
