function ScreenshotRenderer(scene, camera) {
	if (!(scene && scene.children.length > 0 && camera && camera.parent && E2.core.renderer)) {
		return
	}

	// clone scene without overlays
	this.scene = scene.clone(false)
	this.scene.add(scene.children[0].clone())

	// clone the camera (we need a clone because we'll override
	// the aspect ratio later)
	this.dollyCamera = camera.parent.clone()
	this.camera = this.dollyCamera.children[0]

	this.renderer = E2.core.renderer
}

ScreenshotRenderer.prototype.captureBytes = function(width, height) {
	var texture = new THREE.WebGLRenderTarget(width * 2, height * 2, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat } );

	this.camera.aspect = width / height
	this.camera.updateProjectionMatrix()

	var oldPixelRatio = this.renderer.getPixelRatio()

	this.renderer.setPixelRatio(1)
	this.renderer.setClearColor(new THREE.Color(0,0,0))
	this.renderer.setRenderTarget(texture)

	this.renderer.shadowMap.enabled = true

	this.renderer.clear()
	this.renderer.render(this.scene, this.camera, texture, true)

	var doubleResImgData = new Uint8Array(width * 2 * height * 2 * 4)

	var gl = this.renderer.getContext()
	gl.readPixels( 0, 0, width * 2, height * 2, gl.RGBA, gl.UNSIGNED_BYTE, doubleResImgData)

	var imgData = new Uint8Array(width * height * 4)

	// scale to half res
	for (var j = 0, j2 = 0; j < height; ++j, j2 += 2) {
		for (var i = 0, i2 = 0; i < width; ++i, i2 += 2) {
			for (var comp = 0; comp < 4; ++comp) {
				var v = (
					doubleResImgData[((j2    ) * width * 2 + i2    ) * 4 + comp] +
					doubleResImgData[((j2    ) * width * 2 + i2 + 1) * 4 + comp] +
					doubleResImgData[((j2 + 1) * width * 2 + i2    ) * 4 + comp] +
					doubleResImgData[((j2 + 1) * width * 2 + i2 + 1) * 4 + comp]) / 4

				imgData[(j * width + i) * 4 + comp] = v
			}
		}
	}

	this.renderer.setRenderTarget(null)
	this.renderer.setPixelRatio(oldPixelRatio)

	return imgData
}

ScreenshotRenderer.prototype.capture = function(width, height) {
	if (!this.camera) {
		// return a dark gray texture as default
		return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAA" +
		"mkwkpAAAAJklEQVQImS3IMQEAMBCEMHhV598YXZoxbkOt4AQiES6RyOR+EvkARQ0MsXQ" +
		"l4RoAAAAASUVORK5CYII="
	}

	// capture the scene into an Uint8Array
	var imageArray = this.captureBytes(width, height)

	// draw it into a canvas element
	var canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	var context = canvas.getContext('2d')

	// Copy the pixels to a 2D canvas
	var imageData = context.createImageData(width, height)
	imageData.data.set(imageArray)
	context.putImageData(imageData, 0, 0)

	return canvas.toDataURL()
}

if (typeof(exports) !== 'undefined') {
	module.exports = ScreenshotRenderer
}
