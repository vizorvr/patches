function SpotLightHelper(light) {
	AbstractWorldEditorHelperObject.call(this)

	var that = this

	this.assetLoader.loadAsset('texture', "/data/editor-icons/spot-light/IconTextureMap.png")
	.then(function(texture) {
		that.assetLoader.loadAsset('model', '/data/editor-icons/spot-light/spot.obj')
		.then(function(geomsmats) {
			that.geometryLoaded(geomsmats.geometries[0], texture, 0.1)
			that.children[0].material.color = light.color
		})
	})

	this.name = 'spot light helper object'
}

SpotLightHelper.prototype = Object.create( AbstractWorldEditorHelperObject.prototype )
