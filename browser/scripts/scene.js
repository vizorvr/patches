function Scene(gl, core, data, base_path)
{
	this.gl = gl;
	this.texture_cache = E2.app.player.core.renderer.texture_cache;
	this.shader_cache = E2.app.player.core.renderer.shader_cache;
	this.meshes = [];
	this.materials = {};
	this.id = 'n/a';
	this.vertex_count = 0;
	this.core = core;
	this.bounding_box = null;
	
	this.init_bb();
	
	if(data)
		this.load_json(data, base_path);
};

Scene.prototype.init_bb = function(data)
{
	if(!data || !data.bounding_box)
	{
		this.bounding_box = { "lo": vec3.createFrom(0.0, 0.0, 0.0), "hi": vec3.createFrom(0.0, 0.0, 0.0) };
		return;
	}

	data.bounding_box.lo = vec3.create(data.bounding_box.lo);
	data.bounding_box.hi = vec3.create(data.bounding_box.hi);
	
	this.bounding_box = data.bounding_box;
}

Scene.prototype.load_json = function(data, base_path)
{
	var gl = this.gl;
	
	this.id = data.id;
	this.init_bb(data);
	 
	for(var id in data.materials)
	{
		if(!data.materials.hasOwnProperty(id))
			continue;
		
		this.materials[id] = new Material(gl, this.texture_cache, data.materials[id], base_path);
	}
	
	for(var id in data.meshes)
	{
		if(!data.meshes.hasOwnProperty(id))
			continue;
			
		var m = data.meshes[id];
		
		for(var b = 0, len = m.batches.length; b < len; b++)
		{
			var batch = m.batches[b];
			var mesh = new Mesh(gl, gl.TRIANGLES, this.texture_cache, batch, base_path, this.core.asset_tracker, m.instances);
		
			mesh.id = id + '_b' + b;
			mesh.material = this.materials[batch.material];
			mesh.shader = ComposeShader(this.shader_cache, mesh, mesh.material, null, null, null, null);
		
			this.meshes.push(mesh);
			this.vertex_count += mesh.vertex_count;
		}
	}
};

Scene.prototype.render = function(gl, camera, transform, overload_shaders, material)
{
	var meshes = this.meshes;
	
	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK); 
	gl.enable(gl.DEPTH_TEST);
	gl.depthMask(true);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.BLEND);
	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	if(overload_shaders)
	{
		for(var i = 0, len = meshes.length; i < len; i++)
			meshes[i].render(camera, transform, overload_shaders[i], material);
	}
	else
	{
		for(var i = 0, len = meshes.length; i < len; i++)
		{
			var m = meshes[i];
		
			m.render(camera, transform, m.shader, material);
		}
	}
};

Scene.prototype.build_overload_shaders = function(material)
{
	var s_cache = this.shader_cache;
	var meshes = this.meshes;
	var o_shaders = [];
	
	for(var i = 0, len = meshes.length; i < len; i++)
	{
		var mesh = meshes[i];
		var cached = s_cache.get(Material.get_caps_hash(mesh, material));
		
		if(cached)
			o_shaders[i] = cached;
		else
			o_shaders[i] = ComposeShader(s_cache, mesh, material, null, null, null, null);
	}
	
	return o_shaders;
};

Scene.prototype.create_autofit_camera = function()
{
	var bb = this.bounding_box;
	var cam = new Camera();
	
	// If we have no bounding box, default to the old-fashioned 
	//screenspace cam in lieu of something better.
	if(!bb)
		return cam;
	
	var c = E2.app.player.core.renderer.canvas;
	var pos = [bb.hi[0] * 3.0, bb.hi[1] * 3.0, bb.hi[2] * 3.0];
	var d = vec3.create(), tar = vec3.create();
	
	vec3.subtract(bb.hi, bb.lo, d);
	
	var dist = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] + d[2]) * 8.0;
	
	vec3.add(bb.lo, vec3.scale(d, 0.5, tar), tar);
	
	pos[0] = tar[0];
	
	msg('INFO: New autofit camera: ' + pos + ' ... ' + tar[0] + ',' + tar[1] + ',' + tar[2] + ' ... ' + dist);
	
	mat4.perspective(45.0, c.width() / c.height(), 1.0, 1.0 + dist, cam.projection);
	mat4.lookAt(pos, tar, vec3.createFrom(0, 0, 1), cam.view);
	
	return cam;
};
	
Scene.load = function(gl, url, core)
{
	// Create dummy imposter scene and can be used as a null-proxy until asynchronous load completes.
	var scene = new Scene(gl, core, null, null);
	
	core.asset_tracker.signal_started();
	
	jQuery.ajax({
		url: url, 
		dataType: 'json',
		success: function(scene, c) { return function(data) 
		{
			var bp = url.substr(0, url.lastIndexOf('/') + 1);
			var r = c.renderer;
			
			scene.load_json(data, bp);
			msg('INFO: Scene - Finished loading assets from "' + bp + '". Meshes: ' + scene.meshes.length + ', Shaders: ' + scene.shader_cache.count() + ', Textures: ' + scene.texture_cache.count() + ', Vertices: ' + scene.vertex_count);
			msg('INFO: Global cache state: ' + r.texture_cache.count() + ' textures. ' + r.shader_cache.count() + ' shaders.');
			c.asset_tracker.signal_completed();
		}}(scene, core),
		error: function(c) { return function(jqXHR, textStatus, errorThrown)
		{
			msg('ERROR: Failed to load scene "' + url + '": ' + textStatus + ', ' + errorThrown, 'Renderer');
			c.asset_tracker.signal_failed();
		}}(core),
		async: false // TODO: We should definitely change this to be asynchronous!
	});
	
	return scene;
};

