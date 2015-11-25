
function TextureCache() {
	this.textures = {}

	this.defaultTexture = THREE.ImageUtils.loadTexture('data:image/png;base64,\
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAABYklEQVRIia1W23HEMAjcpa\
oUkCaS3ysjtWTSiHsjH8KyjB4Gn9GcxmN8i7zAYm4/m3JfoKqSbkfdlPzbfhUAAQUCF4LDiufYCSrU3\
0XORB8C6ozlJ5cP3sMtJ1RAToyDOlsAQ7wrFG2SxNArUX6V4wAwpx2O6C7IkUuCuN4xiKE6ckkQ14q4\
vL8HKocfv5kEcWuLjIBUx6QBgICAKtCkwaW6vV8SZwkkCF6l/UaZ+kJc2zpA39UM4rYBhvLge/uuUR6\
VhwMXO43Sa9xyj2E3NApUQdpesRxVtH9aFU2L0iShdfH74yul76/P12hm7HrTTRV5J4GXpZGSa8LTFy\
qNywC5tpoEyOg7o6JiRSN2uLC+Z+eHZPU9Oz8kq+/Z+TGkaKXv2fnRJjmk78f8mH4enBpQ3i/EtclDu\
F4ZK1HZiTYDmn4VBgMcNGbnx3WALj25+SHLgiHPOmElVOZHpxoNYdWp/4Hg6yxudLC7AAAAAElFTkSu\
QmCC')
}

TextureCache.prototype.get = function(url) {
	var ce = this.textures[url]

	if (ce) {
		msg('INFO: Returning cahed version of texture \'' + url + '\'.')
		ce.count++
		return ce.texture
	}

	function onLoadFail() {
		// set image to default texture
		this.textures[url].texture.image = this.defaultTexture.image
		this.textures[url].texture.needsUpdate = true
	}
	
	// load a texture, set wrap mode to repeat
	var texture = THREE.ImageUtils.loadTexture(url, undefined, undefined, onLoadFail.bind(this))
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
