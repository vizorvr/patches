function WorldEditorCamera(domElement) {
	this.domElement = domElement
	this.perspectiveCamera = new THREE.PerspectiveCamera(
		90,
		this.domElement.clientWidth / this.domElement.clientHeight,
		0.01,
		10000)

	this.perspectiveCamera.position.set(5, 5, 5)
	this.perspectiveCamera.lookAt(new THREE.Vector3(0,0,0))

	this.perspectiveCamera.channels.enable(1)

	E2.core.on('resize', this.resize.bind(this))
}

WorldEditorCamera.prototype.resize = function() {
	var isFullscreen = !!(document.mozFullScreenElement || document.webkitFullscreenElement);
	var wh = { width: window.innerWidth, height: window.innerHeight }

	if (!isFullscreen) {
		wh.width = this.domElement.clientWidth
		wh.height = this.domElement.clientHeight

		if (typeof(E2.app.calculateCanvasArea) !== 'undefined')
			wh = E2.app.calculateCanvasArea()
	}

	this.perspectiveCamera.aspect = wh.width / wh.height
	this.perspectiveCamera.updateProjectionMatrix()
}
