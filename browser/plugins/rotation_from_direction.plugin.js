(function() {
	var RotationFromDirection = E2.plugins.rotation_from_direction = function(core, node) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'direction',
			dt: E2.dt.VECTOR
		}]

		this.output_slots = [{
			name: 'rotation',
			dt: E2.dt.VECTOR
		}]

		this.defaultRotation = new THREE.Vector3()
	}

	RotationFromDirection.prototype = Object.create(Plugin.prototype)

	RotationFromDirection.prototype.reset = function() {

		this.rotation = this.defaultRotation.clone()

	}

	RotationFromDirection.prototype.update_input = function(slot, data) {
		if (data) {
			var fwd = data.clone()
			fwd.normalize()
			fwd.multiplyScalar(-1)

			var up = new THREE.Vector3(0, 1, 0)

			var right = new THREE.Vector3().crossVectors(fwd, up)
			right.normalize()
			up.crossVectors(right, fwd)
			//up.normalize()

			var mtx = new THREE.Matrix4().makeBasis(right, up, fwd)

			this.rotation.copy(new THREE.Euler().setFromRotationMatrix(mtx,"YXZ").toVector3())
		}
		else {
			this.rotation = this.defaultRotation.clone()
		}
	}

	RotationFromDirection.prototype.update_output = function(slot) {
		return this.rotation
	}

	RotationFromDirection.prototype.state_changed = function(ui) {
		if (ui)
			return;
	}

})()