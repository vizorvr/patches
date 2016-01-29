function ScreenshotRenderer(scene, camera) {
	this.scene = scene
	this.camera = camera

	this.renderer = E2.core.renderer
}

ScreenshotRenderer.prototype.capture = function(width, height) {
	console.log('capturing screenshot', width, height)

	var texture = new THREE.WebGLRenderTarget(width, height, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBFormat } );

	this.renderer.setPixelRatio(1)
	this.renderer.setClearColor(new THREE.Color(0,0,0))
	this.renderer.setRenderTarget(texture)

	this.renderer.clear()
	this.renderer.render(this.scene, this.camera, texture)

	var imgData = new Uint8Array(width * height * 4)

	var gl = this.renderer.getContext()
	gl.readPixels( 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, imgData)

	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	var context = canvas.getContext('2d');

	// Copy the pixels to a 2D canvas
	var imageData = context.createImageData(width, height);
	imageData.data.set(imgData);
	context.putImageData(imageData, 0, 0);

	this.renderer.setRenderTarget(null)

	return canvas.toDataURL()
}