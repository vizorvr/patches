(function() {
	var ThreeMaterialPlugin = E2.plugins.three_material = function(core) {
		this.desc = 'THREE.js Material'
		
		this.input_slots = [
			{ name: 'texture', dt: core.datatypes.TEXTURE },
			{ name: 'color', dt: core.datatypes.COLOR },
			{ name: 'wireframe', dt: core.datatypes.BOOL },
		]

		this.output_slots = [{
			name: 'material',
			dt: core.datatypes.MATERIAL
		}]
	}

	ThreeMaterialPlugin.prototype.reset = function() {
		console.log('reset material')
		this.material = new THREE.MeshBasicMaterial()
	}

	ThreeMaterialPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
			case 0: // texture
				this.material.map = data
				break;
			case 1: // color
				this.material.color = { r: data[0], g: data[1], b: data[2] }
				break;
			case 2: // wireframe
				this.material.wireframe = data
				break;
		}
	}

	ThreeMaterialPlugin.prototype.update_output = function() {
		return this.material
	}

	ThreeMaterialPlugin.prototype.state_changed = function() {}

})()

