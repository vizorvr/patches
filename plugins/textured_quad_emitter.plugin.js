E2.plugins["textured_quad_emitter"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER }
	];
	
	this.output_slots = [];

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
	
	this.reset = function()
	{
		self.shader = null;
	};
	
	this.update_input = function(slot, data)
	{
		self.shader = data;
	};

	this.connection_changed = function(on, conn, slot)
	{
		if(!on)
			self.shader = null;
	};
	
	this.update_state = function(delta_t)
	{
    		gl.disable(gl.DEPTH_TEST);
    		
        	var shader = self.shader;
        	
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
