(function() {
	var ThreeObject3DBBoxExtractor = E2.plugins.three_object3d_bbox_extractor = function (core) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'object3d',
			dt: core.datatypes.OBJECT3D,
			desc: 'mesh to extract bounding box from'
		}]

		this.output_slots = [
			{ name: 'min', dt: core.datatypes.VECTOR },
			{ name: 'max', dt: core.datatypes.VECTOR }
		]

		this.desc = 'Extract bounding box from Mesh'
	}

	ThreeObject3DBBoxExtractor.prototype = Object.create(Plugin.prototype)
	ThreeObject3DBBoxExtractor.prototype.constructor = Plugin.prototype

	ThreeObject3DBBoxExtractor.prototype.reset = function() {
		this.object3d = undefined

		this.bbox = new THREE.Box3()

		this.meshDirty = false
	}

	ThreeObject3DBBoxExtractor.prototype.update_output = function(slot) {
		if (slot.name === 'min') {
			return this.bbox.min
		}
		else if (slot.name === 'max') {
			return this.bbox.max
		}
	}

	ThreeObject3DBBoxExtractor.prototype.update_input = function(slot, data) {
		this.object3d = data
		this.meshDirty = true
	}

	ThreeObject3DBBoxExtractor.prototype.update_state = function() {
		if (!this.meshDirty) {
			return
		}

		if (this.object3d) {
			this.bbox.setFromObject(this.object3d)
		}
		else {
			this.bbox.makeEmpty()
		}

		this.meshDirty = false
	}
})()