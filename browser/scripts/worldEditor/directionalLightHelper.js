function DirectionalLightHelper(light) {
	AbstractWorldEditorHelperObject.call(this)

	var that = this

	this.assetLoader.loadAsset('texture', "/data/editor-icons/directional-light/IconTextureMap.png")
	.then(function(texture) {
		that.assetLoader.loadAsset('model', '/data/editor-icons/directional-light/directional.obj')
		.then(function(geomsmats) {
			that.geometryLoaded(geomsmats.geometries[0], texture, 0.1)
			that.children[0].material.color = light.color
		})
	})

	this.name = 'directional light helper object'
}

DirectionalLightHelper.prototype = Object.create( AbstractWorldEditorHelperObject.prototype )
