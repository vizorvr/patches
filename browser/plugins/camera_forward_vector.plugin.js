(function() {
	var CameraForwardVector = E2.plugins.camera_forward_vector = function(core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Extract the forward vector from a camera'

		this.input_slots = [{
			name: 'camera',
			dt: core.datatypes.CAMERA
		}]

		this.output_slots = [{
			name: 'forward',
			dt: core.datatypes.VECTOR
		}]

		this.forward = new THREE.Vector3(0, 0, -1)
	}

	CameraForwardVector.prototype = Object.create(Plugin.prototype)

	CameraForwardVector.prototype.reset = function() {
		Plugin.prototype.reset.apply(this, arguments)
	}

	CameraForwardVector.prototype.update_input = function(slot, data) {
		if (data) {
			this.forward.set(0, 0, -1)
			this.forward.applyMatrix4(data.matrixWorld)
			this.forward.sub(new THREE.Vector3().setFromMatrixPosition(data.matrixWorld))
		}
		else {
			this.forward.set(0,0,-1)
		}
	}

	CameraForwardVector.prototype.update_output = function(slot) {
		return this.forward
	}

})()