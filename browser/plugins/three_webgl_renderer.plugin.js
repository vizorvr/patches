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

		this.clearColor = new THREE.Color(0.2,0.2,0.2)
	}

	ThreeWebGLRendererPlugin.prototype = Object.create(Plugin.prototype)

	ThreeWebGLRendererPlugin.prototype.stop = function() {
		if (this.renderer) {
			this.renderer.clear()
		}
	}

	ThreeWebGLRendererPlugin.prototype.createOutlinePasses = function() {
		// Initialize our render passes
		this.renderPasses = {}

		// This is the normal rendering pass, render the models in the scene
		this.renderPasses.scene = new THREE.RenderPass(this.scene, this.perspectiveCamera)

		// Render the outline objects. Basically selected object with a bigger radius
		this.renderPasses.outline = new THREE.RenderPass(E2.app.worldEditor.passScenes.outline, this.perspectiveCamera)
		this.renderPasses.outline.clear = false

		// Mask phase to mask out the actual object from the highlight object, to create the highlight effect
		this.renderPasses.mask = new THREE.MaskPass(E2.app.worldEditor.passScenes.mask, this.perspectiveCamera)
		this.renderPasses.mask.inverse = true

		// Clear the mask ?
		this.renderPasses.clearMask = new THREE.ClearMaskPass()

		// The copy phase where we copy the resulting renderTarget to the canvas as a fullscreen quad
		this.renderPasses.copy = new THREE.ShaderPass( THREE.CopyShader )
		this.renderPasses.copy.renderToScreen = true

		// Create our effect composer
		this.composer = new THREE.EffectComposer(this.renderer)

		// Need the stencils for the outline
		this.composer.renderTarget1.stencilBuffer = true
		this.composer.renderTarget2.stencilBuffer = true

		// Add the passes to our composer
		this.composer.addPass(this.renderPasses.scene)
		this.composer.addPass(this.renderPasses.mask)
		this.composer.addPass(this.renderPasses.outline)
		this.composer.addPass(this.renderPasses.clearMask)
		this.composer.addPass(this.renderPasses.copy)
	}

	var OUTLINE_PASSES_CREATED = false;
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

		if (OUTLINE_PASSES_CREATED === false) {
			this.createOutlinePasses()
			OUTLINE_PASSES_CREATED = true
		}
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
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setClearColor(this.clearColor)

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
			var camera = E2.app.worldEditor.getCamera()

			this.renderPasses.scene.scene = this.scene
			this.renderPasses.scene.camera = camera
			this.renderPasses.mask.camera = camera
			this.renderPasses.outline.camera = camera
			this.renderPasses.clearMask.camera = camera

			// Use the composer to render now .. 
			this.composer.render();

			//this.manager.render(this.scene, E2.app.worldEditor.getCamera())
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

	ThreeWebGLRendererPlugin.prototype.resize = function() {
		console.log('ThreeWebGLRendererPlugin.resize')

		var isFullscreen = !!(document.mozFullScreenElement || document.webkitFullscreenElement);
		var wh = { width: window.innerWidth, height: window.innerHeight }

		if (!isFullscreen) {
			wh.width = this.domElement.clientWidth
			wh.height = this.domElement.clientHeight

			if (typeof(E2.app.calculateCanvasArea) !== 'undefined')
				wh = E2.app.calculateCanvasArea()
		}

		this.effect.setSize(wh.width, wh.height)
	}

	ThreeWebGLRendererPlugin.prototype.onFullScreenChanged = function() {
		var isFullscreen = !!(document.mozFullScreenElement || document.webkitFullscreenElement)
		console.log('ThreeWebGLRendererPlugin.onFullScreenChanged', isFullscreen)

		if (!isFullscreen)
			this.manager.enterVR()
		else
			this.manager.exitVR()
	}

	ThreeWebGLRendererPlugin.prototype.toggleFullScreen = function() {
		var isFullscreen = E2.util.isFullscreen()
		console.log('ThreeWebGLRendererPlugin.toggleFullScreen', !isFullscreen)
		this.manager.toggleFullScreen()
	}

	ThreeWebGLRendererPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			console.log('state_changed')
			this.domElement = E2.dom.webgl_canvas[0]
			this.renderer = E2.core.renderer

			this.renderer.setPixelRatio(window.devicePixelRatio)
			this.renderer.autoClear = false;

			// for now (three.js r74) VREffect is not compatible with webvr-boilerplate
			// nor three.js so we use THREE.CardboardEffect instead
			if (!window.vizorNativeWebVRAvailable) {
				this.effect = new THREE.CardboardEffect(this.renderer)
			}
			else {
				this.effect = new THREE.VREffect(this.renderer)
			}

			this.manager = new WebVRManager(this.renderer, this.effect, { hideButton: true })

			E2.core.webVRManager = this.manager		// allow e.g. the player/embed to access this

			E2.core.on('resize', this.resize.bind(this))
			// E2.core.on('fullScreenChanged', this.onFullScreenChanged.bind(this))
			E2.core.on('fullScreenChangeRequested', this.toggleFullScreen.bind(this))

			// resize to initial size
			this.resize()
		}
	}

})()

