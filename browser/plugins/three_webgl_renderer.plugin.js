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
				desc: 'Scene to render',
				def: null
			},
			{
				name: 'bgcolor',
				dt: core.datatypes.COLOR,
				desc: 'Background color',
				def: null
			}
		]

		this.output_slots = []

		this.always_update = true
		this.state = { always_update: true }
	}

	ThreeWebGLRendererPlugin.prototype.stop = function() {
		this.renderer.clear()
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
				break;
			case 2:
				this.renderer.setClearColor(new THREE.Color(data.r, data.g, data.b))
				break;
		}
	}

	ThreeWebGLRendererPlugin.prototype.update_state = function() {
		if (!this.scene) {
			return
		}

		// Render the scene through the manager.
		this.manager.render(this.scene, this.perspectiveCamera)
	}

	ThreeWebGLRendererPlugin.prototype.pick_object = function(e) {
		if (E2.app.noodlesVisible === true)
			return;

		var mouseVector = new THREE.Vector3()

		var wgl_c = E2.dom.webgl_canvas[0]
		var w = wgl_c.clientWidth
		var h = wgl_c.clientHeight

		mouseVector.x = (((e.pageX - wgl_c.offsetLeft) / w) * 2.0) - 1.0
		mouseVector.y = ((1.0 - ((e.pageY - wgl_c.offsetTop) / h)) * 2.0) - 1.0
		mouseVector.z = 0

		if (this.scene.children && this.scene.children.length > 0) {
			this.raycaster.setFromCamera(mouseVector, this.perspectiveCamera)

			// only intersect scene.children[0] - children [1] is the overlays
			var intersects = this.raycaster.intersectObjects(this.scene.children[0].children)

			for (var i = 0; i < intersects.length; i++) {
				if (intersects[i].object.backReference !== undefined) {
					E2.app.clearSelection()
					E2.app.markNodeAsSelected(intersects[i].object.backReference.parentNode)
				}
			}
		}
	}

	ThreeWebGLRendererPlugin.prototype.setup_object_picking = function() {
		$(document).click(this.pick_object.bind(this))
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
			this.renderer = new THREE.WebGLRenderer({
				canvas: this.domElement,
				// antialias: true
			})

			this.renderer.setPixelRatio(window.devicePixelRatio)

			this.effect = new THREE.VREffect(this.renderer)
			this.manager = new WebVRManager(this.renderer, this.effect, { hideButton: false })

			E2.core.on('resize', this.resize.bind(this))
			// E2.core.on('fullScreenChanged', this.onFullScreenChanged.bind(this))
			E2.core.on('fullScreenChangeRequested', this.toggleFullScreen.bind(this))

			this.setup_object_picking()

			// resize to initial size
			this.resize()
		}
	}

})()

