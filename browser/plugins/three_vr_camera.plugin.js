(function() {
	var ThreeVRCameraPlugin = E2.plugins.three_vr_camera = function(core) {
		this.desc = 'THREE.js VR Camera'

		console.log("VR Camera inputs: ", this.input_slots ? this.input_slots.length : "undefined")

		this.input_slots = [
			{ name: 'position', dt: core.datatypes.VECTOR },
			{ name: 'fov', dt: core.datatypes.FLOAT, def: 45.0 },
			{ name: 'aspectRatio', dt: core.datatypes.FLOAT, def: 1.0},
			{ name: 'near', dt: core.datatypes.FLOAT, def: 1.0 },
			{ name: 'far', dt: core.datatypes.FLOAT, def: 1000.0 }
		]

		this.output_slots = [{
			name: 'camera',
			dt: core.datatypes.CAMERA
		}]

		this.always_update = true
		this.dirty = false
	}

	ThreeVRCameraPlugin.prototype = Object.create(Plugin.prototype)

	ThreeVRCameraPlugin.prototype.reset = function() {
		console.log('ThreeVRCameraPlugin reset camera')
		this.domElement = E2.dom.webgl_canvas[0]
		this.positionFromGraph = new THREE.Vector3(0,0,0)

		this.perspectiveCamera = new THREE.PerspectiveCamera(
			90,
			this.domElement.clientWidth / this.domElement.clientHeight,
			0.1,
			1000)

		this.controls = new THREE.VRControls(this.perspectiveCamera)
	}

	ThreeVRCameraPlugin.prototype.play = function() {
		this.resize()
	}

	ThreeVRCameraPlugin.prototype.resize = function() {
		console.log('ThreeVRCameraPlugin.resize')

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

	ThreeVRCameraPlugin.prototype.update_state = function() {
		if (this.dirty)
			this.perspectiveCamera.updateProjectionMatrix()

		this.controls.update(this.positionFromGraph)

		this.updated = true
	}

	ThreeVRCameraPlugin.prototype.update_input = function(slot, data) {
		if (!this.perspectiveCamera) {
			return
		}

		switch(slot.index) {
		case 0: // position
			this.positionFromGraph = data
			this.perspectiveCamera.position.set(data.x, data.y, data.z)
			this.dirty = true
			break
		case 1: // fov
			this.perspectiveCamera.fov = data
			this.dirty = true
			break
		case 2: // aspect ratio
			this.perspectiveCamera.aspectRatio = data
			this.dirty = true
			break
		case 3: // near
			this.perspectiveCamera.near = data
			this.dirty = true
			break
		case 4: // far
			this.perspectiveCamera.far = data
			this.dirty = true
			break
		default:
			break
		}
	}

	ThreeVRCameraPlugin.prototype.update_output = function() {
		return this.perspectiveCamera
	}

	ThreeVRCameraPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			E2.core.on('resize', this.resize.bind(this))
		}
	}

})()

