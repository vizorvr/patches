(function() {
	var ThreeVRCameraPlugin = E2.plugins.three_vr_camera = function(core) {
		this.desc = 'THREE.js VR Camera'
		
		this.defaultFOV = 90

		// try to find out default fov from the device
		if (window.HMDVRDevice && window.HMDVRDevice.getEyeParameters) {
			var eyeParams = window.HMDVRDevice.getEyeParameters()

			if (eyeParams.recommendedFieldOfView) {
				this.defaultFOV = eyeParams.recommendedFieldOfView
			}
			else if (eyeParams.leftDegrees && eyeParams.rightDegrees) {
				this.defaultFOV = eyeParams.leftDegrees + eyeParams.rightDegrees
			}
		}

		this.input_slots = [
			{ name: 'position', dt: core.datatypes.VECTOR },
			{ name: 'fov', dt: core.datatypes.FLOAT, def: this.defaultFOV },
			{ name: 'aspectRatio', dt: core.datatypes.FLOAT, def: 1.0},
			{ name: 'near', dt: core.datatypes.FLOAT, def: 0.001 },
			{ name: 'far', dt: core.datatypes.FLOAT, def: 1000.0 }
		]

		this.output_slots = [
			{name: 'camera',	dt: core.datatypes.CAMERA},
			{name: 'position',	dt: core.datatypes.VECTOR},
			{name: 'rotation',	dt: core.datatypes.VECTOR}
		]

		this.always_update = true
		this.dirty = false
	}

	ThreeVRCameraPlugin.prototype = Object.create(Plugin.prototype)

	ThreeVRCameraPlugin.prototype.reset = function() {
		this.domElement = E2.dom.webgl_canvas[0]

		this.perspectiveCamera = new THREE.PerspectiveCamera(
			this.defaultFOV,
			this.domElement.clientWidth / this.domElement.clientHeight,
			0.001,
			1000)

		this.controls = new THREE.VRControls(this.perspectiveCamera)
	}

	ThreeVRCameraPlugin.prototype.play = function() {
		this.resize()
	}

	ThreeVRCameraPlugin.prototype.resize = function() {
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

	ThreeVRCameraPlugin.prototype.update_output = function(slot) {
		if (slot.index === 0) { // camera
			return this.perspectiveCamera
		}
		else if (slot.index === 1) { // position
			return this.perspectiveCamera.position
		}
		else if (slot.index === 2) { // rotation
			var euler = new THREE.Euler().setFromQuaternion(this.perspectiveCamera.quaternion)
			return new THREE.Vector3(euler.x, euler.y, euler.z)
		}
	}

	ThreeVRCameraPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			E2.core.on('resize', this.resize.bind(this))
		}
	}

})()

