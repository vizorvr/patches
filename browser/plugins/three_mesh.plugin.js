(function() {
	var ThreeMeshPlugin = E2.plugins.three_mesh = function(core) {
		this.desc = 'THREE.js Mesh'
		
		this.input_slots = [
			{ name: 'geometry', dt: core.datatypes.GEOMETRY },
			{ name: 'material', dt: core.datatypes.MATERIAL },
			{ name: 'transform', dt: core.datatypes.MATRIX },
			{ name: 'position', dt: core.datatypes.VECTOR }, // XXX
			{ name: 'rotation', dt: core.datatypes.VECTOR }, // XXX
		]

		this.output_slots = [{
			name: 'mesh',
			dt: core.datatypes.MESH
		}]
	}

	ThreeMeshPlugin.prototype.reset = function() {
		console.log('reset mesh')
		this.geometry = new THREE.BoxGeometry(1, 1, 1)
		this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
		this.mesh = new THREE.Mesh(this.geometry, this.material)
	}

	ThreeMeshPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
			case 0: // geometry
				this.mesh.geometry = data
				break;
			case 1: // material
				this.mesh.material = data
				break;
			case 2: // transform
				break;
			case 3: // position
				this.mesh.position.x = data[0]
				this.mesh.position.y = data[1]
				this.mesh.position.z = data[2]
				break;
			case 4: // rotation
				this.mesh.rotation.x = data[0]
				this.mesh.rotation.y = data[1]
				this.mesh.rotation.z = data[2]
				break;
		}
	}

	ThreeMeshPlugin.prototype.update_output = function() {
		// console.log('update mesh output')
		return this.mesh
	}

	ThreeMeshPlugin.prototype.state_changed = function() {
	}

})()

