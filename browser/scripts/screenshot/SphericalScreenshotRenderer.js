function SphericalScreenshotRenderer(scene, camera) {
	if (!(scene && scene.children.length > 0 && camera && camera.parent && E2.core.renderer)) {
		return
	}

	// clone scene without overlays
	this.scene = scene.clone(false)
	this.scene.add(scene.children[0].clone())

	// clone the camera
	camera.updateMatrixWorld()
	this.cameraMatrix = camera.matrix

	this.renderer = E2.core.renderer
}

SphericalScreenshotRenderer.prototype.capture = function(width, height) {
	// render cube map
	var cubeCamera = new THREE.CubeCamera(0.01, 2000.0, 1024.0)
	cubeCamera.matrix.copy(this.cameraMatrix)

	cubeCamera.updateCubeMap(this.renderer, this.scene)

	// render cube map to spherical image using a custom shader
	var texture = new THREE.WebGLRenderTarget(width * 2, height * 2, {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBFormat } );

	var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1)

	var planeScene = new THREE.Scene()

	var vertexShader =
	"varying vec2 uv1;\n" +
	"void main() {\n" +
	"   uv1 = position.xy;\n" +
	"   gl_Position = vec4(position, 1.0);\n" +
	"}\n"

	var fragmentShader =
	"uniform samplerCube cubeTexture;\n" +
	"varying vec2 uv1;\n" +
	"void main() {\n" +
	"   float xangle = uv1.x * 3.14159;\n" +
	"   float yangle = uv1.y * 3.14159 * 0.5;\n" +
	"   vec3 pos = vec3(sin(xangle) * cos(yangle), -sin(yangle), cos(xangle) * cos(yangle));\n" +
	"   vec4 color = textureCube(cubeTexture, pos);\n" +
	"   gl_FragColor = color;\n" +
	"}\n"

	var uniforms = {
		"cubeTexture": {type: 't', value: cubeCamera.renderTarget}
	}

	var material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader
	})

	var plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 1, 1), material)
	planeScene.add(plane)

	var oldPixelRatio = this.renderer.getPixelRatio()

	this.renderer.setPixelRatio(0.5)
	this.renderer.setClearColor(new THREE.Color(1,0,0))
	this.renderer.setRenderTarget(texture)

	this.renderer.shadowMap.enabled = false

	this.renderer.clear()
	this.renderer.render(planeScene, camera, texture)

	var doubleResImgData = new Uint8Array(width * 2 * height * 2 * 4)

	var gl = this.renderer.getContext()
	gl.readPixels( 0, 0, width * 2, height * 2, gl.RGBA, gl.UNSIGNED_BYTE, doubleResImgData)

	var imgData = new Uint8Array(width * height * 4)

	// scale to half res (and perform 4X multisample antialiasing)
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

	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	var context = canvas.getContext('2d');

	// Copy the pixels to a 2D canvas
	var imageData = context.createImageData(width, height);
	imageData.data.set(imgData);
	context.putImageData(imageData, 0, 0);

	this.renderer.setRenderTarget(null)

	this.renderer.setPixelRatio(oldPixelRatio)

	var res = canvas.toDataURL("image/jpeg")
	return res
}
