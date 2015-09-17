(function() {
	var ThreeScreenSpaceTransformExtractorPlugin = E2.plugins.three_screen_space_transform_extractor = function(core, node) {
		Plugin.apply(this, arguments)

		this.desc = 'Extract transformation from a vr camera for orienting objects to screen space'

		this.input_slots = [{
			name: 'camera',
			dt: core.datatypes.CAMERA
		}]

		this.output_slots = [{
			name: 'position',
			dt: core.datatypes.VECTOR
		}, {
			name: 'rotation',
			dt: core.datatypes.VECTOR
		}, {
			name: 'scale',
			dt: core.datatypes.VECTOR
		}]
	}

	ThreeScreenSpaceTransformExtractorPlugin.prototype = Object.create(Plugin.prototype)

	ThreeScreenSpaceTransformExtractorPlugin.prototype.reset = function() {
		this.position = new THREE.Vector3(0, 0, 0)
		this.rotation = new THREE.Vector3(1, 1, 1)
		this.scale = new THREE.Vector3(1, 1, 1)
	}

	ThreeScreenSpaceTransformExtractorPlugin.prototype.update_input = function(slot, data) {
		if (slot.index === 0) {
			this.position = data.position.clone()

			data.updateMatrixWorld()
			var e = data.matrixWorld.elements;

			var fov = (data.fov || 45) / 180 * 3.1415926
			var s = 1.0 / Math.tan(fov)

			this.position.x -= e[8] * s
			this.position.y -= e[9] * s
			this.position.z -= e[10] * s

			this.rotation = data.rotation
			this.scale = data.scale
		}
	}

	ThreeScreenSpaceTransformExtractorPlugin.prototype.state_changed = function(ui) {
		if (ui) {
			return
		}
	}

	ThreeScreenSpaceTransformExtractorPlugin.prototype.update_state = function() {

	}

	ThreeScreenSpaceTransformExtractorPlugin.prototype.update_output = function(slot) {
		if (slot.index === 0) {
			return this.position
		}
		else if(slot.index === 1) {
			return this.rotation
		}
		else if(slot.index === 2) {
			return this.scale
		}
	}


})()