(function() {
	var ThreeMeshPlugin = E2.plugins.three_mesh = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Mesh'
		
		this.input_slots = [
			{ name: 'geometry', dt: core.datatypes.GEOMETRY },
			{ name: 'material', dt: core.datatypes.MATERIAL },
		].concat(this.input_slots)

		this.output_slots = [{
			name: 'object3d',
			dt: core.datatypes.OBJECT3D
		}]
	}

	ThreeMeshPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeMeshPlugin.prototype.reset = function() {
		console.log('reset mesh')
		this.geometry = new THREE.BoxGeometry(1, 1, 1)
		this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
		this.object3d = new THREE.Mesh(this.geometry, this.material)

		// back reference for object picking
		this.object3d.backReference = this
	}

	ThreeMeshPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
			case 0: // geometry
				this.object3d.geometry = data
				break;
			case 1: // material
				this.object3d.material = data
				break;
			default:
				return ThreeObject3DPlugin.prototype.update_input
					.apply(this, arguments)
		}
	}

})()

