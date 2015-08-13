(function() {
	var ThreeLambertMaterialPlugin = E2.plugins.three_material_lambert = function(core) {
		this.desc = 'THREE.js Lambert Material'
		
		this.input_slots = [
			{ name: 'texture', dt: core.datatypes.TEXTURE },
			{ name: 'color', dt: core.datatypes.COLOR },
			{ name: 'lightMap', dt: core.datatypes.TEXTURE },
			{ name: 'wireframe', dt: core.datatypes.BOOL },
		]

		this.output_slots = [{
			name: 'material',
			dt: core.datatypes.MATERIAL
		}]
	}

	ThreeLambertMaterialPlugin.prototype.reset = function() {
		this.material = new THREE.MeshLambertMaterial()
	}

	ThreeLambertMaterialPlugin.prototype.update_input = function(slot, data) {
		switch(slot.name) {
			case 'texture':
				this.material.map = data
				break;
			case 'color':
				this.material.color = data
				break;
			case 'lightMap':
				this.material.lightMap = data
				break;
			case 'wireframe':
				this.material.wireframe = data
				break;
		}
	}

	ThreeLambertMaterialPlugin.prototype.update_output = function() {
		return this.material
	}

})()

