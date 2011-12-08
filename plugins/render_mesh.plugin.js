g_Plugins["render_mesh"] = function(core) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [ 
		{ name: 'rotation', dt: core.datatypes.FLOAT }
	];
	
	this.output_slots = [];
	this.state = { rotation: 0.0 };
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
	
	var p_mat = mat4.create();
	var m_mat = mat4.create();
	
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, p_mat);
	mat4.identity(m_mat);
	
	this.create_ui = function()
	{
		return null;
	};
	
	this.update_input = function(index, data)
	{
		self.state.rotation = data;
	};

	this.update_state = function(delta_t)
	{
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
    		gl.enable(gl.DEPTH_TEST);
    		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    		
    		gl.bindBuffer(gl.ARRAY_BUFFER, this.meshVertices);
        	gl.vertexAttribPointer(program.vertexPositionAttribute, this.meshVertices.itemSize, gl.FLOAT, false, 0, 0);
        	// setMatrixUniforms();
        	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.meshVertices.numItems);
	};
};
