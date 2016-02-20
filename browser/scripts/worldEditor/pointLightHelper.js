function PointLightHelper(light) {
	AbstractWorldEditorHelperObject.call(this)

	var that = this

	this.assetLoader.loadAsset('texture', "/data/editor-icons/point-light/IconTextureMap.png")
	.then(function(texture) {
		that.assetLoader.loadAsset('model', '/data/editor-icons/point-light/point.obj')
		.then(function(geomsmats) {
			that.geometryLoaded(geomsmats.geometries[0], texture, 0.1)
			that.children[0].material.color = light.color
		})
	})

	this.name = 'point light helper object'
}

PointLightHelper.prototype = Object.create( AbstractWorldEditorHelperObject.prototype )
