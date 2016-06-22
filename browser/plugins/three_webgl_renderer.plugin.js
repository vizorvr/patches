(function() {
	var ThreeWebGLRendererPlugin = E2.plugins.three_webgl_renderer = function(core) {
		Plugin.apply(this, arguments)

		this.desc = 'THREE.js WebGL renderer'

		this.input_slots = [
			{
				name: 'camera',
				dt: core.datatypes.CAMERA,
				desc: 'Camera to use for rendering.'
			},
			{
				name: 'scene',
				dt: core.datatypes.SCENE,
				desc: 'Scene to render'
			},
			{
				name: 'bgcolor',
				dt: core.datatypes.COLOR,
				desc: 'Background color'
			},
			{
				name: 'shadowsEnabled',
				dt: core.datatypes.BOOL,
				desc: 'Master control for whether shadows are rendered',
				def: false
			}
		]

		this.output_slots = []

		this.always_update = true
		this.state = { always_update: true }

		this.clearColor = new THREE.Color(0,0,0)
	}

	ThreeWebGLRendererPlugin.prototype = Object.create(Plugin.prototype)

	ThreeWebGLRendererPlugin.prototype.stop = function() {
		if (this.renderer) {
			this.renderer.clear()
		}
	}

	ThreeWebGLRendererPlugin.prototype.reset = function() {
		this.domElement = E2.dom.webgl_canvas[0]

		console.log('reset',
			this.domElement.clientWidth,
			this.domElement.clientHeight,
			this.domElement.clientWidth / this.domElement.clientHeight)

		this.scene = new THREE.Scene()

		this.perspectiveCamera = new THREE.PerspectiveCamera(
			90,
			this.domElement.clientWidth / this.domElement.clientHeight,
			0.1,
			1000)
	}

	ThreeWebGLRendererPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
			case 0:
				this.perspectiveCamera = data
				return
			case 1:
				this.scene = data
				this.patchSceneForWorldEditor(this.scene)
				return
			case 2:
				this.clearColor = new THREE.Color(data.r, data.g, data.b)
				return
		}

		Plugin.prototype.update_input.apply(this, arguments)
	}

	ThreeWebGLRendererPlugin.prototype.update_state = function() {
		// workaround for having to share the renderer between render to texture & render to screen
		// tbd: remove once https://github.com/mrdoob/three.js/pull/6723 is merged into a three release

		this.renderer.setClearColor(this.clearColor)

		if (!this.scene || !this.perspectiveCamera) {
			this.renderer.clear()
			return
		}
		
		// three.js needs a window.scene
		window.scene = this.scene

		this.renderer.shadowMap.enabled = this.inputValues.shadowsEnabled

		if (this.manager.isVRMode()) {
			// vr mode doesn't necessarily update the world matrix
			// could be a bug in new version of three.js
			this.perspectiveCamera.updateMatrixWorld()
		}

		if (E2.app.worldEditor.isActive())
			E2.app.worldEditor.preRenderUpdate()

		var activeCamera = this.getActiveCamera()

		THREE.glTFAnimator.update();
		THREE.glTFShaders.update(this.scene, activeCamera);

		this.manager.render(this.scene, activeCamera)

		if (E2.app.debugFpsDisplayVisible) {
			this.stats.begin()

			this.stats.renderOrtho()

			this.stats.end()
		}

	}

	ThreeWebGLRendererPlugin.prototype.getActiveCamera = function() {
		if (E2.app.worldEditor.isActive()) {
			// Render the scene through the world editor camera
			return E2.app.worldEditor.getCamera()
		} else {
			// Render the scene through the experience camera
			return this.perspectiveCamera
		}
	}

	ThreeWebGLRendererPlugin.prototype.play = function() {
		// one initial resize
		this.manager.resizeToTarget()
	}

	ThreeWebGLRendererPlugin.prototype.patchSceneForWorldEditor = function() {
		if (E2.app.worldEditor.updateScene) {
			// tell the editor about changes in the scene
			E2.app.worldEditor.updateScene(this.scene, this.perspectiveCamera)
		}
	}

	ThreeWebGLRendererPlugin.prototype.onTargetResized = function(s) {
		function updateCamera(camera, s) {
			camera.aspect = s.width / s.height;
			camera.updateProjectionMatrix();
		}
		if (this.perspectiveCamera)
			updateCamera(this.perspectiveCamera, s)

		if (E2.app.worldEditor && E2.app.worldEditor.getCamera)
			updateCamera(E2.app.worldEditor.getCamera(), s)

		this.renderer.setPixelRatio(s.devicePixelRatio)
		this.effect.setSize(s.width, s.height)
	}

	ThreeWebGLRendererPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			this.domElement = E2.dom.webgl_canvas[0]
			this.renderer = E2.core.renderer

			var gl = this.domElement.getContext("webgl");
			this.stats = new WGLUStats(gl)

			var nativeWebVRAvailable = VizorWebVRAdapter.isNativeWebVRAvailable()

			this.effect = new THREE.VREffect(this.renderer)

			this.manager = E2.core.webVRAdapter
			var events = this.manager.events

			this.manager.on(events.targetResized, this.onTargetResized.bind(this))

			this.manager.initialise(this.domElement, this.renderer, this.effect)

		}
	}

})()

