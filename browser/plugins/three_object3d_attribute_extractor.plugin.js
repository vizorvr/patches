(function() {
	var ThreeObject3DAttributeExtractor = E2.plugins.three_object3d_attribute_extractor = function (core) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'object3d',
			dt: core.datatypes.OBJECT3D,
			desc: 'mesh to extract attributes from'
		}]

		this.output_slots = [
			{ name: 'position', dt: core.datatypes.VECTOR },
			{ name: 'rotation', dt: core.datatypes.VECTOR },
			{ name: 'scale', dt: core.datatypes.VECTOR },
			{ name: 'name', dt: core.datatypes.TEXT }
		]

		this.desc = 'Extract position, rotation and scale from a Mesh'

		this.euler = new THREE.Euler()
	}

	ThreeObject3DAttributeExtractor.prototype = Object.create(Plugin.prototype)
	ThreeObject3DAttributeExtractor.prototype.constructor = Plugin.prototype

	ThreeObject3DAttributeExtractor.prototype.reset = function() {
		this.object3d = undefined

		this.position = new THREE.Vector3(0, 0, 0)
		this.rotation = new THREE.Vector3(0, 0, 0)
		this.scale = new THREE.Vector3(1, 1, 1)

		this.name = ''

		this.meshDirty = false
	}

	ThreeObject3DAttributeExtractor.prototype.update_output = function(slot) {
		if (slot.name === 'position') {
			return this.position
		}
		else if (slot.name === 'rotation') {
			return this.rotation
		}
		else if (slot.name === 'scale') {
			return this.scale
		}
		else if (slot.name === 'name') {
			return this.name
		}
	}

	ThreeObject3DAttributeExtractor.prototype.update_input = function(slot, data) {
		this.object3d = data
		this.meshDirty = true
	}

	ThreeObject3DAttributeExtractor.prototype.update_state = function() {
		if (!this.meshDirty) {
			return
		}
		this.position.copy(this.object3d.position)

		this.euler.setFromQuaternion(this.object3d.quaternion)
		this.rotation.set(this.euler.x, this.euler.y, this.euler.z)

		this.scale.copy(this.object3d.scale)

		this.name = this.object3d.name

		this.meshDirty = false
	}
})()