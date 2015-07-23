function Texture(renderer, handle, filter)
{
	var gl = this.gl = renderer.context;

	this.renderer = renderer;
	this.min_filter = this.mag_filter = filter || gl.LINEAR;
	this.wrap_s = this.wrap_t = gl.REPEAT;
	this.texture = handle || gl.createTexture();
	this.width = 0;
	this.height = 0;
	this.image = null;
	this.complete = true;
}

Texture.prototype.create = function(width, height)
{
	this.upload(new Image(width, height), 'Internal Create');
};

Texture.prototype.drop = function()
{
	this.gl.deleteTexture(this.texture);
	this.texture = null;
};

Texture.prototype.load = function(src, core)
{
	var img = new Image();
	
	img.onload = function(self, src, c) { return function()
	{
		msg('INFO: Finished loading texture \'' + src + '\'.');
		self.upload(img, src);
		c.asset_tracker.signal_completed();
	}}(this, src, core);
	
	img.onerror = function(self, src, c) { return function()
	{
		var dt = c.renderer.default_tex;

		msg('ERROR: Failed to load texture \'' + src + '\'', 'Renderer');
		c.asset_tracker.signal_failed();

		self.drop();
		self.texture = dt.texture;
		self.width = dt.width;
		self.height = dt.height;
	}}(this, src, core);
	
	this.complete = false;
	core.asset_tracker.signal_started();
    img.crossOrigin = "Anonymous";
	img.src = src;
};

Texture.prototype.enable = function(stage)
{
	var gl = this.gl;
	
	if(gl.bound_tex_stage !== stage || gl.bound_tex !== this.texture) // Don't rebind
	{
		gl.activeTexture(stage || gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		this.renderer.extensions.set_anisotropy(4);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.min_filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.mag_filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrap_s);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrap_t);
		gl.bound_tex_stage = stage;
		gl.bound_tex = this.texture;
	}
};

Texture.prototype.disable = function()
{
	var gl = this.gl;
	
	gl.bindTexture(gl.TEXTURE_2D, null);
};

Texture.prototype.isPow2 = function(n)
{
	var v =  Math.log(n) / Math.log(2);	
	var v_int = Math.floor(v);
	
	return (v - v_int === 0.0);
};

// Accepts both Image and Canvas instances.
Texture.prototype.upload = function(img, src)
{
	var w = img.width || img.videoWidth;
	var h = img.height || img.videoHeight;
	
	if(!this.isPow2(w))
	{
		msg('ERROR: The width (' + w + ') of the texture \'' + src + '\' is not a power of two.');
		return;
	}
	
	if(!this.isPow2(h))
	{
		msg('ERROR: The height (' + h + ') of the texture \'' + src + '\' is not a power of two.');
		return;
	}
	
	var gl = this.gl;

	var devicePixelRatio = window.devicePixelRatio || 1;
	var pixelRatioAdjustedWidth = devicePixelRatio * w;
	var pixelRatioAdjustedHeight = devicePixelRatio * h;
	
	this.width = pixelRatioAdjustedWidth;
	this.height = pixelRatioAdjustedHeight;
	this.image = img;

	this.enable();
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	this.disable();
	
	this.complete = true;
};

Texture.prototype.set_filtering = function(down, up)
{
	this.min_filter = down;
	this.mag_filter = up;
};

function TextureCache(gl, core)
{
	this.gl = gl;
	this.core = core;
	this.textures = {};
}

TextureCache.prototype.get = function(url)
{
	var ce = this.textures[url];

	if(ce !== undefined)
	{
		msg('INFO: Returning cahed version of texture \'' + url + '\'.');
		ce.count++;
		return ce.texture;
	}
	
	var t = new Texture(this.core.renderer);
	
	msg('INFO: Fetching texture \'' + url + '\'.');
	
	t.load(url, this.core);
	this.textures[url] = { count:0, texture:t };
	
	return t;
};

TextureCache.prototype.clear = function()
{
	this.textures = {};
};

TextureCache.prototype.count = function()
{
	var c = 0;
	var ts = this.textures;
	
	for(var t in ts)
	{
		if(ts.hasOwnProperty(t))
			++c;
	}
		
	return c;
};

