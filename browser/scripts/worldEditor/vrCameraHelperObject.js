function VRCameraHelper( camera ) {
	AbstractWorldEditorHelperObject.call(this)

	var that = this

	this.assetLoader.loadAsset('texture', "/data/editor-icons/vr-camera/IconTextureMap.png")
	.then(function(texture) {
		that.assetLoader.loadAsset('model', '/data/editor-icons/vr-camera/Head1.obj')
		.then(function(geomsmats) {
			that.geometryLoaded(geomsmats.geometries[0], texture)
		})
	})

	this.name = 'vr camera helper object'
}

VRCameraHelper.prototype = Object.create( AbstractWorldEditorHelperObject.prototype )
