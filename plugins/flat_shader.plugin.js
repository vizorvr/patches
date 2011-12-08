g_Plugins["flat_shader"] = function(core) {
	var self = this;
	var renderer = core.renderer; 
	var gl = renderer.context;
	
	this.input_slots = [
		 { name: 'R', dt: core.datatypes.FLOAT },
		 { name: 'G', dt: core.datatypes.FLOAT },
		 { name: 'B', dt: core.datatypes.FLOAT },
		 { name: 'A', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER } 
	];
	
	this.state = { rgba: [ 1.0, 1.0, 1.0, 1.0] };
	
	var vs_src = '\
		precision mediump float;\n\
		\n\
		uniform vec4 color;\n\
		\n\
		void main(void) {\n\
			gl_FragColor = color;\n\
		}';
	
	var ps_src = '\
		attribute vec3 pos;\n\
		\n\
		uniform mat4 m_mat;\n\
		uniform mat4 p_mat;\n\
		\n\
		void main(void) {\n\
			gl_Position = p_mat * m_mat * vec4(pos, 1.0);\n\
		}';

	this.s = new ShaderProgram(gl);
	this.vs = new Shader(gl, gl.VERTEX_SHADER, vs_src);
	this.ps = new Shader(gl, gl.FRAGMENT_SHADER, ps_src);
	
	this.s.attach(this.vs);
	this.s.attach(this.ps);
	this.s.link();
	
        this.s.pMatUniform = gl.getUniformLocation(this.s, "p_mat");
        this.s.mMatUniform = gl.getUniformLocation(this.s, "m_mat");
        this.s.colorUniform = gl.getUniformLocation(this.s, "color");
        
      	this.create_ui = function()
	{
		return null;
	};
	
	this.update_input = function(index, data)
	{
		self.state.rgba[index] = data;
	};
	
	this.update_state = function()
	{
		gl.uniformMatrix4fv(self.s.pMatUniform, false, renderer.p_mat);
		gl.uniformMatrix4fv(self.s.mMatUniform, false, renderer.m_mat);
		gl.uniform4fv(self.s.colorUniform, false, self.state.rgba);
       	};
	
	this.update_output = function(index)
	{
		return self.s;
	};
};
