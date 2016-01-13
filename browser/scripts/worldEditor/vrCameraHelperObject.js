function VRCameraHelper( camera ) {

	THREE.Object3D.call(this)

	var that = this

	function geometryLoaded(geometry, texture) {

		var scale = 0.01
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

		that.matrixAutoUpdate = false

		that.add(mesh)

	}

	var assetLoader = E2.core.assetLoader

	assetLoader.loadAsset('texture', "/data/editor-icons/vr-camera/IconTextureMap.png")
	.then(function(texture) {
		assetLoader.loadAsset('model', '/data/editor-icons/vr-camera/Head1.obj')
		.then(function(geomsmats) {
			geometryLoaded(geomsmats.geometries[0], texture)
		})
	})

	if (camera) {
		this.attachCamera(camera)
	}
}

VRCameraHelper.prototype = Object.create( THREE.Object3D.prototype )
VRCameraHelper.prototype.constructor = THREE.CameraHelper

VRCameraHelper.prototype.dispose = function() {
	this.geometry.dispose()
	this.material.dispose()
}

VRCameraHelper.prototype.attachCamera = function(camera) {
	this.camera = camera

	this.matrix = this.camera.matrixWorld

	this.backReference = this.camera.backReference
}
