g_Plugins["colored_quad_emitter"] = function(core) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER }
	];
	
	this.output_slots = [];
	this.state = { shader: null };
	this.vertices = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
	
	var v_data = [
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0
       	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v_data), gl.STATIC_DRAW);
	
	this.itemSize = 3;
	this.numItems = 4;
	
	this.update_input = function(index, data)
	{
		self.state.shader = data;
	};

	this.update_state = function(delta_t)
	{
    		gl.disable(gl.DEPTH_TEST);
    		
        	var shader = self.state.shader;
        	
        	if(shader !== null)
        	{
        		shader.enable();
			shader.bind_array(core.renderer.array_type.VERTEX, self.vertices, 3); 
               		shader.apply_uniforms();
	        	
	        	gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.numItems);
	        }
	};
};
