function AbstractWorldEditorHelperObject(referenceObj) {
	THREE.Object3D.call(this)

	this.assetLoader = E2.core.assetLoader

	if (referenceObj) {
		this.attach(referenceObj)
	}
}

AbstractWorldEditorHelperObject.prototype = Object.create( THREE.Object3D.prototype )

AbstractWorldEditorHelperObject.prototype.geometryLoaded = function(geometry, texture, scale) {
	var scale = scale || 0.01
	var rotation = Math.PI

	var material = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		map: texture,
		wireframe: false,
		opacity: 0.9,
		transparent: true})

	var mesh = new THREE.Mesh(geometry, material)
	mesh.scale.set(scale, scale, scale)
	mesh.quaternion.setFromEuler(new THREE.Euler(0, rotation, 0))

	this.matrixAutoUpdate = false

	this.add(mesh)
}

AbstractWorldEditorHelperObject.prototype.attach = function(referenceObj) {
	this.referenceObj = referenceObj

	this.matrix = this.referenceObj.matrixWorld

	this.backReference = this.referenceObj.backReference
	this.helperObjectBackReference = this.referenceObj
}
