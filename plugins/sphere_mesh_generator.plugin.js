E2.plugins["sphere_mesh_generator"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.input_slots = [
		{ name: 'v res', dt: core.datatypes.FLOAT },
		{ name: 'h res', dt: core.datatypes.FLOAT }
	];
	this.output_slots = [ { name: 'mesh', dt: core.datatypes.MESH } ];
	this.state = { v_res: 15, h_res: 15 };
	
	this.mesh = null;
	
	this.reset = function()
	{
		self.updated = true;
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0 && self.state.v_res !== data && data > 1)
		{
			self.state.v_res = data;
			self.generate_mesh();
		}
		else if(slot.index === 1 && self.state.h_res !== data && data > 1)
		{
			self.state.h_res = data;
			self.generate_mesh();
		}
	};
	
	this.update_output = function(slot)
	{
		return self.mesh;
	};
	
	this.generate_mesh = function()
	{
		msg('Sphere: Generating mesh.');
		self.mesh = new Mesh(gl, gl.TRIANGLES);
	
		var verts = [], norms = [], uvs = [], indices = [];
		var d_ang_v = Math.PI / self.state.v_res; 
		var d_ang_h = (2.0 * Math.PI) / self.state.h_res;
		var index = 0;
		var v_res = self.state.v_res;
		var h_res = self.state.h_res;
		
		for(var v = 0; v < v_res + 1; v++)
		{
			var r0 = Math.sin(v * d_ang_v);
			var y0 = Math.cos(v * d_ang_v);
			
			for(var h = 0; h < h_res + 1; h++)
			{
				var x0 = r0 * Math.sin(h * d_ang_h);
				var z0 = r0 * Math.cos(h * d_ang_h);
				
				verts.push(x0);
				verts.push(y0);
				verts.push(z0);
				
				var l = Math.sqrt((x0 * x0) + (y0 * y0) + (z0 * z0));
			
				if(l < 0.00001)
					l = 1.0;
				
				l = 1.0 / l;
				norms.push(x0 * l);
				norms.push(y0 * l);
				norms.push(z0 * l);
				
				uvs.push(h / h_res);
				uvs.push(v / v_res);
				
				if(v !== v_res)
				{
					indices.push(index + h_res + 1);
					indices.push(index);
					indices.push(index + h_res);
					indices.push(index + h_res + 1);
					indices.push(index + 1);
					indices.push(index);
					
					index++;
				} 
			}
		}

		var vb = self.mesh.vertex_buffers['VERTEX'] = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX);
		
		vb.bind_data(verts);

		var nb = self.mesh.vertex_buffers['NORMAL'] = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL);
		
		nb.bind_data(norms);

		var uvb = self.mesh.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0);
		
		uvb.bind_data(uvs);

		var ib = self.mesh.index_buffer = new IndexBuffer(gl);
		
		ib.bind_data(indices);
	};
	
	this.state_changed = function(ui)
	{
		if(!ui)
			self.generate_mesh();
	};
};
