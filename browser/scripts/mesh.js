function Mesh(gl, prim_type, t_cache, data, base_path, asset_tracker, instances, onLoadCb)
{
	this.gl = gl;
	this.prim_type = prim_type;
	this.vertex_buffers = {};
	this.index_buffer = null;
	this.t_cache = t_cache;
	this.material = new Material();
	this.vertex_count = 0;
	this.stream_count = 0;
	this.streams_loaded = 0;
	this.max_prims = null;
	this.instances = instances;
	
	for(var v_type in VertexBuffer.vertex_type)
		this.vertex_buffers[v_type] = null;
		
	if(data)
	{
		var load_stream = function(url, lo, rng, stream, parent)
		{
			var img = new Image();
		
			lo = parseFloat(lo);
			rng = parseFloat(rng);
			
			asset_tracker.signal_started();
		
			img.onload = function(parent) { return function()
			{
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');
				
				canvas.width = img.width;
				canvas.height = img.height;
				
				ctx.imageSmoothingEnabled = false;
				ctx.webkitImageSmoothingEnabled = false;
				ctx.globalCompositeOperation = 'copy';
				
				ctx.drawImage(img, 0, 0);
			
				var pd = ctx.getImageData(0, 0, img.width, img.height);
				var count = pd.width * pd.height;
				var dv = new DataView(pd.data.buffer);
				var ab = new ArrayBuffer(count);
				var abdv = new DataView(ab);
				var data = [];
				
				// Extract the datastream from the canvas RGBA data.
				for(var i = 0, o = 0; o < count; i += 4, o++)
					abdv.setUint8(o, dv.getUint8(i));
				
				// Decode
				for(i = 0; i < count; i+=4)
					data.push(abdv.getFloat32(i, false));
				
				stream.bind_data(data);
			
				parent.vertex_count = count / (4 * 3);
				parent.streams_loaded++;

				msg('INFO: Finished loading stream from ' + img.src + ' with ' + (count / 4) + ' elements. (' + parent.streams_loaded + ' / ' + parent.stream_count + ')');
				asset_tracker.signal_completed();
				onLoadCb();
			}}(parent);
		
			img.onerror = function()
			{
				asset_tracker.signal_failed();
			};
		
			img.onabort = function()
			{
				asset_tracker.signal_failed();
			};

		    img.crossOrigin = "Anonymous";
			img.src = base_path + url + '.png';
		};
		
		if(data.vertices)
		{
			this.stream_count++;
			load_stream(data.vertices, data.v_lo, data.v_rng, this.vertex_buffers.VERTEX = new VertexBuffer(gl, VertexBuffer.vertex_type.VERTEX), this);
		}
		
		if(data.normals)
		{
			this.stream_count++;
			load_stream(data.normals, data.n_lo, data.n_rng, this.vertex_buffers.NORMAL = new VertexBuffer(gl, VertexBuffer.vertex_type.NORMAL), this);
		}
		
		if(data.uv0)
		{
			this.stream_count++;
  			load_stream(data.uv0, data.uv0_lo, data.uv0_rng, this.vertex_buffers['UV0'] = new VertexBuffer(gl, VertexBuffer.vertex_type.UV0), this)
		}
		
		if(data.indices)
		{
			var idx = this.index_buffer = new IndexBuffer(gl);
			
			idx.bind_data(data.indices);
		}
	}
}

Mesh.prototype.generate_shader = function()
{
	this.shader = ComposeShader(E2.app.player.core.renderer.shader_cache, this, this.material, null, null, null, null);
}

Mesh.prototype.get_stride = function()
{
	return [1, 2, 2, 2, 3, 3, 3][this.prim_type];
};

Mesh.prototype.render = function(camera, transform, shader, material)
{
	var verts = this.vertex_buffers['VERTEX'];
	var shader = shader || this.shader;
	var gl = this.gl;
	var mat = material ? material : this.material;
	
	if(!verts || !shader || !shader.linked || this.streams_loaded < this.stream_count)
		return;
	
	if(gl.bound_mesh !== this || gl.bound_shader !== this.shader)
	{
		shader.enable();
	
		for(var v_type in VertexBuffer.vertex_type)
		{
			var vb = this.vertex_buffers[v_type];
		
			if(vb)
				vb.bind_to_shader(shader);
		}

		shader.bind_camera(camera);
		shader.apply_uniforms(this, mat);
		gl.bound_shader = shader;
	}
	
	var draw_count = this.index_buffer ? this.index_buffer.count : verts.count;
	
	if(this.max_prims !== null)
	{
		var rd = this.max_prims * this.get_stride();
		
		if(rd < draw_count)
			draw_count = rd;
	}
	
	if(!this.instances)
	{
		shader.bind_transform(transform);
		
		if(!this.index_buffer)
		{
			gl.drawArrays(this.prim_type, 0, draw_count);
		}
		else
		{
			if(gl.bound_mesh !== this)
				this.index_buffer.enable();
			
			gl.drawElements(this.prim_type, draw_count, gl.UNSIGNED_SHORT, 0);
		}
	}
	else
	{
		var inst = this.instances;
		var ft = mat4.create();
		
		if(!this.index_buffer)
		{
			for(var i = 0, len = inst.length; i < len; i++)
			{
				if(!transform.invert)
					mat4.multiply(transform, inst[i], ft);
				else
					mat4.multiply(inst[i], transform, ft);
				
				shader.bind_transform(ft);
				gl.drawArrays(this.prim_type, 0, draw_count);
			}
		}
		else
		{
			this.index_buffer.enable();

			for(var i = 0, len = inst.length; i < len; i++)
			{
				if(!transform.invert)
					mat4.multiply(transform, inst[i], ft);
				else
					mat4.multiply(inst[i], transform, ft);
			
				shader.bind_transform(ft);
				gl.drawElements(this.prim_type, draw_count, gl.UNSIGNED_SHORT, 0);
			}
		}
	}

	gl.bound_mesh = this;
};
