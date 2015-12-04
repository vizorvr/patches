
function TextureCache() {
	this.textures = {}

	this.defaultTexture = THREE.ImageUtils.loadTexture('/data/textures/defaulttex.png')
	this.loadingTexture = THREE.ImageUtils.loadTexture('/data/textures/loadingtex.png')
}

TextureCache.prototype.get = function(url) {
	var ce = this.textures[url]

	if (ce) {
		msg('INFO: Returning cached version of texture \'' + url + '\'.')
		ce.count++
		return ce.texture
	}

	function onLoadFail() {
		// set image to default texture
		this.textures[url].texture.image = this.defaultTexture.image
		this.textures[url].texture.needsUpdate = true
	}
	
	// load a texture, set wrap mode to repeat
	var texture = THREE.ImageUtils.loadTexture(url, 
		undefined,
		undefined,
		onLoadFail.bind(this))

	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping

	msg('INFO: Fetching texture \'' + url + '\'.')

	this.textures[url] = { count: 0, texture: texture }

	return texture
}

TextureCache.prototype.clear = function() {
	this.textures = {}
}

TextureCache.prototype.count = function() {
	var c = 0
	var ts = this.textures
	
	for (var t in ts) {
		if (ts.hasOwnProperty(t))
			++c
	}
	
	return c
}
