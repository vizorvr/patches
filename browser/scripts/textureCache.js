
function TextureCache() {
	this.textures = {}
}

TextureCache.prototype.get = function(url) {
	var ce = this.textures[url]

	if (ce) {
		msg('INFO: Returning cahed version of texture \'' + url + '\'.')
		ce.count++
		return ce.texture
	}
	
	// load a texture, set wrap mode to repeat
	var texture = THREE.ImageUtils.loadTexture(url)
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.repeat.set(1, 1)
	
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
