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

	var firstResize = true
	ThreeWebGLRendererPlugin.prototype.update_state = function() {
		// workaround for having to share the renderer between render to texture & render to screen
		// tbd: remove once https://github.com/mrdoob/three.js/pull/6723 is merged into a three release
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setClearColor(this.clearColor)

	    if (firstResize) {
			this.resize()
			firstResize = false
	    }

		if (!this.scene || !this.perspectiveCamera) {
			this.renderer.clear()

			return
		}

		this.renderer.shadowMap.enabled = this.inputValues.shadowsEnabled

		if (this.manager.isVRMode()) {
			// vr mode doesn't necessarily update the world matrix
			// could be a bug in new version of three.js
			this.perspectiveCamera.updateMatrixWorld()
		}

		if (E2.app.worldEditor.isActive()) {
			E2.app.worldEditor.preRenderUpdate()

			// Render the scene through the world editor camera
			this.manager.render(this.scene, E2.app.worldEditor.getCamera())
		}
		else {
			// Render the scene through the experience camera
			this.manager.render(this.scene, this.perspectiveCamera)
		}
	}

	ThreeWebGLRendererPlugin.prototype.patchSceneForWorldEditor = function() {
		if (E2.app.worldEditor.updateScene) {
			// tell the editor about changes in the scene
			E2.app.worldEditor.updateScene(this.scene, this.perspectiveCamera)
		}
	}

	ThreeWebGLRendererPlugin.prototype.play = function() {
		this.resize()
	}

	ThreeWebGLRendererPlugin.prototype.onVRPresentChange = function() {
		// change canvas size
		this.resize()
	}

	ThreeWebGLRendererPlugin.prototype.resize = function() {
		console.log('ThreeWebGLRendererPlugin.resize')

		var hmd = this.manager.hmd
		var isPresenting = hmd && hmd.isPresenting

		if (isPresenting) {
			var leftEye = hmd.getEyeParameters("left")
			var rightEye = hmd.getEyeParameters("right")

			this.domElement.width = leftEye.renderWidth * 2
			this.domElement.height = leftEye.renderHeight
		}
		else {
			this.domElement.width = this.domElement.offsetWidth * window.devicePixelRatio
			this.domElement.height = this.domElement.offsetHeight * window.devicePixelRatio
		}

		var isFullscreen = !!(document.mozFullScreenElement || document.webkitFullscreenElement);
		var wh = { width: window.innerWidth, height: window.innerHeight }

		if (!isFullscreen) {
			wh.width = this.domElement.offsetWidth
			wh.height = this.domElement.offsetHeight
		}

		this.effect.setSize(wh.width, wh.height)
	}

	ThreeWebGLRendererPlugin.prototype.enterVROrFullscreen = function() {
		this.manager.toggleFullScreen()
	}

	ThreeWebGLRendererPlugin.prototype.exitVROrFullscreen = function() {
		var that = this

		// to get back to normal mode, we have to:
		// 1) exit presentation mode
		// 2) do an equivalent to WebVRManager.prototype.onBackClick_()
		if (this.manager.hmd && this.manager.hmd.isPresenting) {
			this.manager.hmd.exitPresent()
			.then(function() {
				that.manager.setMode_(1)
				that.manager.exitFullscreen_()
			})
		}
		else {
			// no hmd, we still want to go to normal mode
			that.manager.setMode_(1);
			that.manager.exitFullscreen_();
		}
	}

	/*
	application calls this when we intend to get to fullscreen
	or come back from it to normal mode
	*/
	ThreeWebGLRendererPlugin.prototype.toggleFullScreen = function() {
		var goingToFullscreen = this.manager.mode === 1
		console.log('ThreeWebGLRendererPlugin.toggleFullScreen', goingToFullscreen)

		var that = this

		if (goingToFullscreen) {
			// normal to VR or full screen
			this.enterVROrFullscreen()
		}
		else {
			// toggleFullScreen doesn't get back from VR mode so we have to
			// do it ourselves

			this.exitVROrFullscreen()
		}
	}

	ThreeWebGLRendererPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			this.domElement = E2.dom.webgl_canvas[0]
			this.renderer = E2.core.renderer

			this.renderer.setPixelRatio(window.devicePixelRatio)

			// for now (three.js r74) VREffect is not compatible with webvr-boilerplate
			// nor three.js so we use THREE.CardboardEffect instead
			//if (!window.vizorNativeWebVRAvailable) {
			//	this.effect = new THREE.CardboardEffect(this.renderer)
			//}
			//else {
				this.effect = new THREE.VREffect(this.renderer)
			//}

			this.manager = new WebVRManager(this.renderer, this.effect, { hideButton: true })

			E2.core.webVRManager = this.manager		// allow e.g. the player/embed to access this

			E2.core.on('resize', this.resize.bind(this))
			E2.core.on('orientationchange', this.resize.bind(this))

			// E2.core.on('fullScreenChanged', this.onFullScreenChanged.bind(this))
			E2.core.on('fullScreenChangeRequested', this.toggleFullScreen.bind(this))
			window.addEventListener('vrdisplaypresentchange', this.onVRPresentChange.bind(this), false)
		}
	}

})()

