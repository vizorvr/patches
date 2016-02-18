function HemisphereLightHelper(light) {
	AbstractWorldEditorHelperObject.call(this)

	var that = this

	this.assetLoader.loadAsset('texture', "/data/editor-icons/hemisphere-light/IconTextureMap.png")
	.then(function(texture) {
		that.assetLoader.loadAsset('model', '/data/editor-icons/hemisphere-light/hemisphere.obj')
		.then(function(geomsmats) {
			that.geometryLoaded(geomsmats.geometries[0], texture, 0.1)
			that.children[0].material.color = light.color
		})
	})

	this.name = 'hemisphere light helper object'
}

HemisphereLightHelper.prototype = Object.create( AbstractWorldEditorHelperObject.prototype )
