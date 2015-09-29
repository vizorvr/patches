(function() {
	var ThreeObject3DAttributeExtractor = E2.plugins.three_object3d_attribute_extractor = function (core) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'object3d',
			dt: core.datatypes.OBJECT3D,
			desc: 'mesh to extract attributes from',
			array: true
		}]

		this.output_slots = [
			{ name: 'position', dt: core.datatypes.VECTOR },
			{ name: 'rotation', dt: core.datatypes.VECTOR },
			{ name: 'scale', dt: core.datatypes.VECTOR }
		]

		this.desc = 'Extract attributes from a Mesh'
	}

	ThreeObject3DAttributeExtractor.prototype = Object.create(Plugin.prototype)
	ThreeObject3DAttributeExtractor.prototype.constructor = Plugin.prototype

	ThreeObject3DAttributeExtractor.prototype.reset = function() {
		this.object3d = undefined
	}

	ThreeObject3DAttributeExtractor.prototype.update_output = function(slot) {
		if (!this.object3d) {
			return slot.name === 'scale' ? new THREE.Vector3(1, 1, 1) : new THREE.Vector3(0, 0, 0)
		}

		if (slot.name === 'position') {
			return this.object3d.position
		}
		else if (slot.name === 'rotation') {
			var euler = new THREE.Euler()
			euler.setFromQuaternion(this.object3d.quaternion)
			return new THREE.Vector3(euler.x, euler.y, euler.z)
		}
		else if (slot.name === 'scale') {
			return this.object3d.scale
		}
	}

	ThreeObject3DAttributeExtractor.prototype.update_input = function(slot, data) {
		if (data.length !== undefined) {
			this.object3d = data[0]
		}
		else {
			this.object3d = data
		}

	}
})()