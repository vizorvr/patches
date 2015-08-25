(function() {
	var ThreeMeshDepthMaterialPlugin = E2.plugins.three_material_depth = function(core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)

		this.desc = 'THREE.js Mesh Depth Material'
		
		this.input_slots = [
			{	name: 'wireframe', dt: core.datatypes.BOOL, def: false },
		].concat(this.input_slots)

		this.output_slots = [{
			name: 'material',
			dt: core.datatypes.MATERIAL
		}]
	}

	ThreeMeshDepthMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

	ThreeMeshDepthMaterialPlugin.prototype.reset = function() {
		AbstractThreeMaterialPlugin.prototype.reset.call(this)
		this.material = new THREE.MeshDepthMaterial()
	}


})()

