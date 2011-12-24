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
	
	var t_data = [
		 1.0,  1.0,
		 0.0,  1.0,
		 1.0,  0.0,
		 0.0,  0.0
       	];

	this.tex_coords = gl.createBuffer();	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_coords);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(t_data), gl.STATIC_DRAW);

	this.itemSize = 3;
	this.numItems = 4;
	
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
    		
        	// TODO: This thight integration between shader and rendering plugins won't do. We
        	// have to come up with an interface.
        	// It'll do for a demo, though.
        	var shader = self.state.shader;
        	
        	if(shader != null)
        	{
        		shader.enable();

			gl.bindBuffer(gl.ARRAY_BUFFER, self.vertices);
			gl.vertexAttribPointer(shader.vertexPosAttribute, self.itemSize, gl.FLOAT, false, 0, 0);
			
               		shader.apply_uniforms();
        	
	        	gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.numItems);
	        }
	};
};
