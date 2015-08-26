(function() {
	var ThreeLambertMaterialPlugin = E2.plugins.three_material_lambert = function(core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)
		
		this.desc = 'THREE.js Lambert Material'
		
		this.input_slots = [
			{ name: 'texture', dt: core.datatypes.TEXTURE },
			{ name: 'color', dt: core.datatypes.COLOR },
			{ name: 'lightMap', dt: core.datatypes.TEXTURE },
			{ name: 'wireframe', dt: core.datatypes.BOOL },
		].concat(this.input_slots)

		this.output_slots = [{
			name: 'material', dt: core.datatypes.MATERIAL
		}]
	}

	ThreeLambertMaterialPlugin.prototype.reset = function() {
		this.material = new THREE.MeshLambertMaterial()
	}

	ThreeLambertMaterialPlugin.prototype.update_output = function() {
		return this.material
	}

})()

