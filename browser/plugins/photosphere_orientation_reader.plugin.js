(function() {
	var PhotosphereOrientationReader = E2.plugins.photosphere_orientation_reader = function(core, node) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'texture',
			dt: E2.dt.TEXTURE
		}]

		this.output_slots = [{
			name: 'rotation',
			dt: E2.dt.VECTOR
		}]

		this.defaultRotation = new THREE.Vector3()
	}

	PhotosphereOrientationReader.prototype = Object.create(Plugin.prototype)

	PhotosphereOrientationReader.prototype.reset = function() {

	}

	PhotosphereOrientationReader.prototype.update_output = function(slot) {
		return this.rotation
	}

	PhotosphereOrientationReader.prototype.update_input = function(slot, data) {
		if (data.vizorMetadata) {
			var pitch = data.vizorMetadata.pitch
			var heading = data.vizorMetadata.heading
			var roll = data.vizorMetadata.roll

			this.rotation = new THREE.Vector3(pitch / 180 * Math.PI, -heading / 180 * Math.PI, -roll / 180 * Math.PI)
		}
		else {
			this.rotation = this.defaultRotation
		}
	}

})()