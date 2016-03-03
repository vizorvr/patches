(function() {
	var ThreeOrbitCameraPlugin = E2.plugins.three_orbit_camera = function(core) {
		Plugin.apply(this, arguments)

		this.desc = 'THREE.js Orbit Camera'

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
			{ name: 'rotation', dt: core.datatypes.VECTOR },
			{ name: 'offset', dt: core.datatypes.VECTOR, def: new THREE.Vector3(2, 2, 2)},
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

		this.state = {
			position: {x: 0, y: 0, z:0},

			// names with underscores have to match with THREE.Quaternion
			// member variable names because of to/from json serialisation
			quaternion: {_x: 0, _y: 0, _z:0, _w:1}
		}

		this.rotationFromGraph = new THREE.Euler()
		this.positionFromGraph = new THREE.Vector3()

		this.outputRotationEuler = new THREE.Euler()
		this.outputPosition = new THREE.Vector3()
	}

	ThreeOrbitCameraPlugin.prototype = Object.create(Plugin.prototype)

	ThreeOrbitCameraPlugin.prototype.reset = function() {
		Plugin.prototype.reset.apply(this, arguments)

		this.domElement = E2.dom.webgl_canvas[0]

		if (!this.dolly) {
			this.dolly = new THREE.PerspectiveCamera()
		}

		if (!this.orbitControlCamera) {
			this.orbitControlCamera = new THREE.PerspectiveCamera(
				this.defaultFOV,
				this.domElement.clientWidth / this.domElement.clientHeight,
				0.001,
				1000)

			// layer is for mono camera only
			this.orbitControlCamera.layers.enable(3)

			this.dolly.add(this.orbitControlCamera)
		}

		// create an object3d reference so that the world editor sees the camera
		// as an object3d
		this.object3d = this.dolly
		this.object3d.backReference = this

		if (!this.controls) {
			this.controls = new THREE.OrbitControls(this.orbitControlCamera, this.domElement)
		}

		this.object3d.position.set(this.state.position.x, this.state.position.y, this.state.position.z)
		this.object3d.quaternion.set(this.state.quaternion._x, this.state.quaternion._y, this.state.quaternion._z, this.state.quaternion._w)

		this.positionFromGraph.copy(this.inputValues.position)
		this.orbitControlCamera.position.copy(this.inputValues.offset)

		this.controls.update()
	}

	ThreeOrbitCameraPlugin.prototype.play = function() {
		this.resize()
	}

	ThreeOrbitCameraPlugin.prototype.resize = function() {
		var isFullscreen = !!(document.mozFullScreenElement || document.webkitFullscreenElement);
		var wh = { width: window.innerWidth, height: window.innerHeight }

		if (!isFullscreen) {
			wh.width = this.domElement.clientWidth
			wh.height = this.domElement.clientHeight

			if (typeof(E2.app.calculateCanvasArea) !== 'undefined')
				wh = E2.app.calculateCanvasArea()
		}

		this.orbitControlCamera.aspect = wh.width / wh.height
		this.orbitControlCamera.updateProjectionMatrix()
	}

	ThreeOrbitCameraPlugin.prototype.update_state = function() {
		this.object3d.position.set(
			this.positionFromGraph.x + this.state.position.x,
			this.positionFromGraph.y + this.state.position.y,
			this.positionFromGraph.z + this.state.position.z)

		this.object3d.quaternion.setFromEuler(this.rotationFromGraph)
		this.object3d.quaternion.multiply(this.state.quaternion)

		if (this.dirty)
			this.orbitControlCamera.updateProjectionMatrix()

		this.object3d.updateMatrixWorld()

		this.updated = true
	}

	ThreeOrbitCameraPlugin.prototype.update_input = function(slot, data) {
		if (!this.object3d) {
			return
		}

		if (slot.name === 'position') { // position
			this.positionFromGraph.copy(data)
			this.dirty = true
		}
		else if (slot.name === 'rotation') {
			this.rotationFromGraph.set(data.x, data.y, data.z)
			this.dirty = true
		}
		else if (slot.name === 'offset') {
			this.orbitControlCamera.position.copy(data)
			this.dirty = true
		}
		else if (slot.name === 'fov') {
			this.orbitControlCamera.fov = data
			this.dirty = true
		}
		else if (slot.name === 'aspectRatio') {
			this.orbitControlCamera.aspect = data
			this.dirty = true
		}
		else if (slot.name === 'near') {
			this.orbitControlCamera.near = data
			this.dirty = true
		}
		else if (slot.name === 'far') {
			this.orbitControlCamera.far = data
			this.dirty = true
		}
	}

	ThreeOrbitCameraPlugin.prototype.update_output = function(slot) {
		if (slot.index === 0) { // camera
			return this.orbitControlCamera
		}
		else if (slot.index === 1) { // position
			this.outputPosition.copy(this.orbitControlCamera.position)
			this.outputPosition.applyMatrix4(this.orbitControlCamera.matrixWorld)
			return this.outputPosition
		}
		else if (slot.index === 2) { // rotation
			var tempQuaternion = this.orbitControlCamera.quaternion.clone()
			tempQuaternion.multiply(this.object3d.quaternion)
			this.outputRotationEuler.setFromQuaternion(tempQuaternion, "YZX")
			return this.outputRotationEuler
		}
	}

	ThreeOrbitCameraPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			E2.core.on('resize', this.resize.bind(this))
		}
	}

	ThreeOrbitCameraPlugin.prototype.canEditPosition = function() {
		return true
	}

	ThreeOrbitCameraPlugin.prototype.canEditQuaternion = function() {
		return true
	}

	ThreeOrbitCameraPlugin.prototype.canEditScale = function() {
		return false
	}

})()

