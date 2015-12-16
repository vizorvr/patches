(function() {

function TextureLoader() {
	E2.Loaders.ImageLoader.apply(this, arguments)
}
TextureLoader.prototype = Object.create(E2.Loaders.ImageLoader.prototype)
TextureLoader.prototype.onImageLoaded = function(img) {
	var texture = new THREE.Texture()
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.image = img
	texture.needsUpdate = true

	this.emit('loaded', texture)
}

E2.Loaders.TextureLoader = TextureLoader

if (typeof(module) !== 'undefined') {
	module.exports.TextureLoader = TextureLoader
}

})()
