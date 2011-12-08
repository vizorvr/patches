g_Plugins["render_mesh"] = function(core) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [ 
		{ name: 'shader', dt: core.datatypes.SHADER }
	];
	
	this.output_slots = [];
	this.state = { shader: null };
	this.meshVertices = gl.createBuffer();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, this.meshVertices);
	
	var vertices = [
		 1.0,  1.0,  0.0,
		-1.0,  1.0,  0.0,
		 1.0, -1.0,  0.0,
		-1.0, -1.0,  0.0
       	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	this.meshVertices.itemSize = 3;
	this.meshVertices.numItems = 4;
	
	this.create_ui = function()
	{
		return null;
	};
	
	this.update_input = function(index, data)
	{
		self.state.shader = data;
	};

	this.update_state = function(delta_t)
	{
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
    		gl.enable(gl.DEPTH_TEST);
    		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    		
    		gl.bindBuffer(gl.ARRAY_BUFFER, this.meshVertices);
        	gl.vertexAttribPointer(program.vertexPositionAttribute, this.meshVertices.itemSize, gl.FLOAT, false, 0, 0);
        	
        	if(self.state.shader != null)
        		self.state.shader.enable();
        	
        	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.meshVertices.numItems);
	};
};
