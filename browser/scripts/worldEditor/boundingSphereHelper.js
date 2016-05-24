function BoundingSphereHelper( camera ) {
	AbstractWorldEditorHelperObject.call(this)

	var that = this

	this.matrixAutoUpdate = false
	this.geometryLoaded(new THREE.SphereBufferGeometry(1), E2.core.assetLoader.defaultTexture, 1.0, 0.4)

	this.name = 'bounding sphere camera helper object'

	this.defaultPosition = new THREE.Vector3(0, 0, 0)
}

BoundingSphereHelper.prototype = Object.create( AbstractWorldEditorHelperObject.prototype )

BoundingSphereHelper.prototype.attach = function(referenceObj) {
	var position = this.defaultPosition

	referenceObj.updateMatrixWorld()

	var scale = 0
	if (referenceObj.geometry) {
		referenceObj.geometry.computeBoundingSphere()
		scale = referenceObj.geometry.boundingSphere.radius
		position = referenceObj.geometry.boundingSphere.center
	}
	this.children[0].scale.set(scale, scale, scale)
	this.children[0].position.copy(position)
	this.children[0].updateMatrixWorld()

	AbstractWorldEditorHelperObject.prototype.attach.apply(this, arguments)
}
