function WorldEditorCamera(domElement) {
	this.domElement = domElement
	this.camera = new THREE.PerspectiveCamera(
		90,
		this.domElement.clientWidth / this.domElement.clientHeight,
		0.01,
		10000)

	this.camera.position.set(5, 5, 5)
	this.camera.lookAt(new THREE.Vector3(0,0,0))

	// mono eye only
	this.camera.layers.enable(3)

	E2.core.on('resize', this.resize.bind(this))
}

WorldEditorCamera.prototype.resize = function() {
	var isFullscreen = E2.util.isFullscreen()
	var wh = { width: window.innerWidth, height: window.innerHeight }

	if (!isFullscreen) {
		wh.width = this.domElement.clientWidth
		wh.height = this.domElement.clientHeight

		if (typeof(E2.app.calculateCanvasArea) !== 'undefined')
			wh = E2.app.calculateCanvasArea()
	}

	this.camera.aspect = wh.width / wh.height
	this.camera.updateProjectionMatrix()
}

WorldEditorCamera.prototype.update = function() {

}