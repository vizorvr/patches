g_Plugins["textured_quad_emitter"] = function(core) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER }
	];
	
	this.output_slots = [];
	this.state = { shader: null };
	
	var v_data = [
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0
       	];

	this.vertices = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v_data), gl.STATIC_DRAW);
	
	var uv_data = [
		 1.0,  1.0,
		 0.0,  1.0,
		 1.0,  0.0,
		 0.0,  0.0
       	];

	this.uv_coords = gl.createBuffer();	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_coords);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv_data), gl.STATIC_DRAW);
	
	this.update_input = function(index, data)
	{
		self.state.shader = data;
	};

	this.update_state = function(delta_t)
	{
		// TODO: We shouldn't be clearing here. We may need an 'execution order' dummy emitter... Sort of implies dynamic slot support, eh?
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
    		gl.enable(gl.DEPTH_TEST);
    		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    		
        	var shader = self.state.shader;
        	
        	if(shader !== null)
        	{
			var types = core.renderer.array_type;
			
        		shader.enable();
			shader.bind_array(types.VERTEX, self.vertices, 3);
			shader.bind_array(types.UV0, self.uv_coords, 2);
               		shader.apply_uniforms();
        	
	        	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	        }
	};
};
