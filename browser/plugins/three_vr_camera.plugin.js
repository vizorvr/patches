(function() {
	var ThreeVRCameraPlugin = E2.plugins.three_vr_camera = function(core) {
		var that = this

		Plugin.apply(this, arguments)

		this.desc = 'THREE.js VR Camera'
		
		this.findDefaultFov()

		this.input_slots = [
			{ name: 'position', dt: core.datatypes.VECTOR },
			{ name: 'rotation', dt: core.datatypes.VECTOR },
			{ name: 'fov', dt: core.datatypes.FLOAT, def: this.defaultFOV },
			{ name: 'aspectRatio', dt: core.datatypes.FLOAT, def: 1.0},
			{ name: 'near', dt: core.datatypes.FLOAT, def: 0.01 },
			{ name: 'far', dt: core.datatypes.FLOAT, def: 10000.0 },
			{
				name:   'lock transform',
				dt:     core.datatypes.BOOL,
				def:    false,
				label:  'Lock transform',
				desc:   'If enabled, the transform coming from the HMD is ignored'
			}
		]

		this.output_slots = [
			{ name: 'camera',	dt: core.datatypes.CAMERA },
			{ name: 'offset',	dt: core.datatypes.VECTOR,
			  desc: 'The position offset of the camera.' },
			{ name: 'position',	dt: core.datatypes.VECTOR,
			  desc: 'The current position of the headset.' },
			{ name: 'rotation',	dt: core.datatypes.VECTOR }
		]

		this.always_update = true
		this.dirty = false
		this.locked = false

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

		this.node.on('pluginStateChanged', function() {
			that.offset.set(that.state.position.x, that.state.position.y, that.state.position.z)
		})

		E2.app.player.cameraPlugin = this
	}

	ThreeVRCameraPlugin.prototype = Object.create(Plugin.prototype)

	ThreeVRCameraPlugin.prototype.findDefaultFov = function() {
		var that = this

		this.defaultFOV = 90

		if (!navigator.getVRDisplays)
			return;

		navigator.getVRDisplays()
		.then(function(vrDisplays) {
			var displays = vrDisplays.filter(function(display) {
				return display instanceof VRDisplay &&
					display.capabilities.canPresent
			})

			if (displays.length) {
				var eyeParams = displays[0].getEyeParameters('left')
				if (eyeParams)
					that.defaultFOV = eyeParams.fieldOfView.leftDegrees + eyeParams.fieldOfView.rightDegrees;
			}
		})

	}

	ThreeVRCameraPlugin.prototype.reset = function() {
		Plugin.prototype.reset.apply(this, arguments)

		this.domElement = E2.dom.webgl_canvas[0]

		if (!this.dolly)
			this.dolly = new THREE.PerspectiveCamera()

		if (!this.vrControlCamera) {
			this.vrControlCamera = E2.app.player.vrControlCamera

			// layer is for mono camera only
			this.vrControlCamera.layers.enable(3)

			this.dolly.add(this.vrControlCamera)
		}

		// create an object3d reference so that the world editor sees the camera
		// as an object3d
		this.object3d = this.dolly
		this.object3d.backReference = this

		if (!this.controls) {
			this.controls = new THREE.VRControls(this.vrControlCamera)
		}

		this.object3d.position.set(this.state.position.x, this.state.position.y, this.state.position.z)
		this.object3d.quaternion.set(this.state.quaternion._x, this.state.quaternion._y, this.state.quaternion._z, this.state.quaternion._w)

		this.offset = new THREE.Vector3(this.state.position.x, this.state.position.y, this.state.position.z)
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

		this.vrControlCamera.aspect = wh.width / wh.height
		this.vrControlCamera.updateProjectionMatrix()

		concatenatedCamera.aspect = this.vrControlCamera.aspect
		concatenatedCamera.projectionMatrix = this.vrControlCamera.projectionMatrix.clone()
	}

	ThreeVRCameraPlugin.prototype.update_state = function() {
		var concatenatedCamera = E2.app.player.concatenatedCamera
		var hmd = E2.core.webVRAdapter.hmd

		this.object3d.position.set(
			this.positionFromGraph.x + this.state.position.x,
			this.positionFromGraph.y + this.state.position.y,
			this.positionFromGraph.z + this.state.position.z)

		this.object3d.quaternion.setFromEuler(this.rotationFromGraph)
		this.object3d.quaternion.multiply(this.state.quaternion)

		if (this.dirty)
			this.vrControlCamera.updateProjectionMatrix()

		if (!this.locked)
			this.controls.update(new THREE.Vector3(), new THREE.Quaternion())

		this.object3d.updateMatrixWorld()

		concatenatedCamera.position.copy(this.object3d.position)

		if (hmd.capabilities.hasPosition) {
			concatenatedCamera.quaternion.copy(this.object3d.quaternion)
		} else {
			concatenatedCamera.quaternion.multiplyQuaternions(
				this.object3d.quaternion,
				this.vrControlCamera.quaternion)
		}

		concatenatedCamera.updateMatrixWorld()

		this.updated = true
	}

	ThreeVRCameraPlugin.prototype.update_input = function(slot, data) {
		if (!this.object3d) {
			return
		}

		switch(slot.index) {
		case 0: // position
			this.positionFromGraph.copy(data)
			this.dirty = true
			break
		case 1: // rotation
			this.rotationFromGraph.set(data.x, data.y, data.z)
			this.dirty = true
			break
		case 2: // fov
			this.vrControlCamera.fov = data
			this.dirty = true
			break
		case 3: // aspect ratio
			this.vrControlCamera.aspect = data
			this.dirty = true
			break
		case 4: // near
			this.vrControlCamera.near = data
			this.dirty = true
			break
		case 5: // far
			this.vrControlCamera.far = data
			this.dirty = true
			break
		case 6: // locked transforms
			this.locked = data
			break
		default:
			break
		}
	}

	ThreeVRCameraPlugin.prototype.update_output = function(slot) {
		if (slot.index === 0) { // camera
			return this.vrControlCamera
		} else if (slot.index === 1) { // offset
			return this.offset
		} else if (slot.index === 2) { // position
			return E2.app.player.concatenatedCamera.position.clone()
		}
		else if (slot.index === 3) { // rotation
			var tempQuaternion = this.vrControlCamera.quaternion.clone()
			tempQuaternion.multiply(this.object3d.quaternion)
			this.outputRotationEuler.setFromQuaternion(tempQuaternion, "YZX")
			return this.outputRotationEuler
		}
	}

	ThreeVRCameraPlugin.prototype.state_changed = function(ui) {
		if (!ui) {
			E2.core.on('resize', this.resize.bind(this))
		}
	}

	ThreeVRCameraPlugin.prototype.canEditPosition = function() {
		return true
	}

	ThreeVRCameraPlugin.prototype.canEditQuaternion = function() {
		return true
	}

	ThreeVRCameraPlugin.prototype.canEditScale = function() {
		return false
	}

})()

