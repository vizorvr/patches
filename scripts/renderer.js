function Renderer(canvas_id)
{
	if(!window.WebGLRenderingContext)
		window.location = 'http://get.webgl.org';

  	this.canvas_id = canvas_id;
	
	var canvas = $(canvas_id);

	this.context = canvas[0].getContext('experimental-webgl');
	
	if(this.context)
	{
		this.context.viewportWidth = canvas.width();
		this.context.viewportHeight = canvas.height();
	}
	else
		msg('Error: WebGL initialization failed.');
}

function Shader(gl, type, src)
{
	this.shader = gl.createShader(type);
	
	gl.shaderSource(this.shader, src);
	gl.compileShader();
	
	if(!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS))
		msg('Shader compilation failed:\n' + gl.getShaderInfoLog(this.shader));
}

function ShaderProgram(gl)
{
	this.gl = gl;
	this.program = gl.createProgram();

	this.attach = function(shader)
	{
		this.gl.attachShader(this.program, shader);
	};
	
	this.link = function()
	{
		this.gl.linkProgram(this.program);

		if(!this.gl.getProgramParameter(this.program, gl.LINK_STATUS))
      			msg('Shader linking failed.');
      	};
      	
      	// TODO: Resume from: https://github.com/gpjt/webgl-lessons/blob/35a02ac2360da4d1e3a9d6fa389832711b0c8d84/lesson01/index.html
      	this.enable = function()
      	{
		this.gl.useProgram(this.program);
      	}
}
