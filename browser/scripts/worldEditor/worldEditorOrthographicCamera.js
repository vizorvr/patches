function WorldEditorOrthographicCamera(domElement) {
	this.domElement = domElement

	this.camera = new THREE.OrthographicCamera(
		-1, 1,
		1, -1,
		-10000,
		10000)

	this.camera.zoom = 10
	this.aspect = 1

	this.camera.channels.enable(1)

	E2.core.on('resize', this.resize.bind(this))
}

WorldEditorOrthographicCamera.prototype.resize = function() {
	var isFullscreen = E2.util.isFullscreen()
	var wh = { width: window.innerWidth, height: window.innerHeight }

	if (!isFullscreen) {
		wh.width = this.domElement.clientWidth
		wh.height = this.domElement.clientHeight

		if (typeof(E2.app.calculateCanvasArea) !== 'undefined')
			wh = E2.app.calculateCanvasArea()
	}

	this.aspect = wh.width / wh.height

	this.camera.left = -this.aspect
	this.camera.right = this.aspect
	this.camera.top = 1
	this.camera.bottom = -1
}

WorldEditorOrthographicCamera.prototype.update = function() {
	var distance = this.camera.position.length()

	var zoom = 1 / distance

	if (this.camera.zoom !== zoom) {
		this.camera.zoom = zoom

		this.camera.updateProjectionMatrix()
	}
}
