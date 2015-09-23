(function() {
	var ThreeWebGLRendererPlugin = E2.plugins.three_webgl_renderer = function(core) {
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
			}
		]

		this.output_slots = []

		this.always_update = true
		this.state = { always_update: true }

		this.clearColor = new THREE.Color(0,0,0)
	}

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
				break;
			case 1:
				this.scene = data
				this.patchSceneForWorldEditor(this.scene)
				break;
			case 2:
				this.clearColor = new THREE.Color(data.r, data.g, data.b)
				break;
		}
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

		if (this.manager.isVRMode()) {
			// vr mode doesn't necessarily update the world matrix
			// could be a bug in new version of three.js
			this.perspectiveCamera.updateMatrixWorld()
		}

		if (E2.app.worldEditor.isActive()) {
			// Render the scene through the world editor camera
			this.manager.render(this.scene, E2.app.worldEditor.getCamera())
		}
		else {
			// Render the scene through the experience camera
			this.manager.render(this.scene, this.perspectiveCamera)
		}
	}

	ThreeWebGLRendererPlugin.prototype.patchSceneForWorldEditor = function() {
		if (E2.app.worldEditor.isActive()) {
			// tell the editor about changes in the scene
			E2.app.worldEditor.updateScene(this.scene)

			// add the editor object tree into the scene
			var editorRoot = E2.app.worldEditor.getEditorSceneTree()

			var editorIdx = this.scene.children.indexOf(editorRoot)
			if (editorIdx < 0) {
				this.scene.add(editorRoot)
			}
		}
	}

	ThreeWebGLRendererPlugin.prototype.pick_object = function(e) {
		if (E2.app.noodlesVisible === true)
			return;

		var isEditor = E2.app.worldEditor.isActive()

		var activeCamera
		if (isEditor) {
			activeCamera = E2.app.worldEditor.getCamera()
		}
		else {
			activeCamera = this.perspectiveCamera
		}

		var mouseVector = new THREE.Vector3()

		var wgl_c = E2.dom.webgl_canvas[0]
		var w = wgl_c.clientWidth
		var h = wgl_c.clientHeight

		mouseVector.x = (((e.pageX - wgl_c.offsetLeft) / w) * 2.0) - 1.0
		mouseVector.y = ((1.0 - ((e.pageY - wgl_c.offsetTop) / h)) * 2.0) - 1.0
		mouseVector.z = 0

		if (this.scene && this.scene.children && this.scene.children.length > 0) {
			this.raycaster.setFromCamera(mouseVector, activeCamera)

			// only intersect scene.children[0] - children [1] is the overlays
			var intersects = this.raycaster.intersectObjects(this.scene.children[0].children, /*recursive = */ true)
			
			for (var i = 0; i < Math.min(intersects.length, 1); i++) {
				if (intersects[i].object.backReference !== undefined) {
					E2.app.clearSelection()
					E2.app.markNodeAsSelected(intersects[i].object.backReference.parentNode)
				}
			}

			if (isEditor) {
				E2.app.worldEditor.setSelection(intersects)
			}
		}
		else if (isEditor) {
			E2.app.worldEditor.setSelection([])
		}
	}

	ThreeWebGLRendererPlugin.prototype.setup_object_picking = function() {
		$(document).mousedown(this.pick_object.bind(this))
		this.raycaster = new THREE.Raycaster()
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
		var isFullscreen = !!(document.mozFullScreenElement || document.webkitFullscreenElement)
		console.log('ThreeWebGLRendererPlugin.toggleFullScreen', !isFullscreen)
		this.manager.toggleFullScreen()
	}

	ThreeWebGLRendererPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			console.log('state_changed')
			this.domElement = E2.dom.webgl_canvas[0]
			this.renderer = E2.core.renderer

			this.renderer.setPixelRatio(window.devicePixelRatio)

			this.effect = new THREE.VREffect(this.renderer)
			this.manager = new WebVRManager(this.renderer, this.effect, { hideButton: false })

			E2.core.on('resize', this.resize.bind(this))
			// E2.core.on('fullScreenChanged', this.onFullScreenChanged.bind(this))
			E2.core.on('fullScreenChangeRequested', this.toggleFullScreen.bind(this))

			// if selection functions exist, we can object pick
			if (E2.app.clearSelection && E2.app.setSelection && E2.app.markNodeAsSelected) {
				this.setup_object_picking()
			}

			// resize to initial size
			this.resize()
		}
	}

})()

