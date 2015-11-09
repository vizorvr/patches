(function() {
	var ThreeMaterialExtractorPlugin = E2.plugins.three_material_extractor = function(core) {
		this.desc = 'THREE.js Material Extractor'

		this.input_slots = [
			{   name: 'material', dt: core.datatypes.MATERIAL}
		]

		this.output_slots = [
			{	name: 'texture', dt: core.datatypes.TEXTURE },
			{   name: 'lightMap', dt: core.datatypes.TEXTURE },
			{   name: 'bumpMap', dt: core.datatypes.TEXTURE },
			{   name: 'normalMap', dt: core.datatypes.TEXTURE },
			{   name: 'specularMap', dt: core.datatypes.TEXTURE },
			{   name: 'displacementMap', dt: core.datatypes.TEXTURE },
			{   name: 'alphaMap', dt: core.datatypes.TEXTURE },
			{	name: 'color', dt: core.datatypes.COLOR },
			{	name: 'wireframe', dt: core.datatypes.BOOL },
			{	name: 'fog', dt: core.datatypes.BOOL },
			{	name: 'shading', dt: core.datatypes.FLOAT },
			{	name: 'opacity', dt: core.datatypes.FLOAT },
			{	name: 'transparent', dt: core.datatypes.FLOAT },
			{	name: 'blending', dt: core.datatypes.FLOAT },
			{	name: 'side', dt: core.datatypes.FLOAT }
		]
	}

	ThreeMaterialExtractorPlugin.prototype = Object.create(Plugin.prototype)

	ThreeMaterialExtractorPlugin.prototype.reset = function() {
	}

	ThreeMaterialExtractorPlugin.prototype.update_input = function(slot, data) {
		this.material = data
	}

	ThreeMaterialExtractorPlugin.prototype.update_output = function(slot) {
		if (slot.name === 'texture') {
			return this.material.map
		}
		else {
			return this.material[slot.name]
		}
	}

})()

