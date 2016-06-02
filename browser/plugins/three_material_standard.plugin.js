(function() {
	var ThreeStandardMaterialPlugin = E2.plugins.three_material_standard = function(core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)

		this.desc = 'THREE.js Standard Material'

		this.input_slots = [
			{	name: 'color', dt: core.datatypes.COLOR, def: new THREE.Color(0xffffff) },
			{	name: 'roughness', dt: core.datatypes.FLOAT, def: 0.5 },
			{	name: 'metalness', dt: core.datatypes.FLOAT, def: 0.5 },

			{	name: 'texture', dt: core.datatypes.TEXTURE },
			{   name: 'lightMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'lightMapIntensity', dt: core.datatypes.FLOAT, def: 1 },

			{	name: 'aoMap', dt: core.datatypes.TEXTURE },
			{	name: 'aoIntensity', dt: core.datatypes.FLOAT, def: 1.0 },

			{	name: 'emissiveMap', dt: core.datatypes.TEXTURE, def: undefined },
			{	name: 'emissive', dt: core.datatypes.COLOR, def: new THREE.Color(0) },
			{	name: 'emissiveIntensity', dt: core.datatypes.FLOAT, def: 1.0 },

			{   name: 'bumpMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'bumpScale', dt: core.datatypes.FLOAT, def: 1 },

			{   name: 'normalMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'normalScale', dt: core.datatypes.VECTOR, def: new THREE.Vector3(1, 1, 1) },

			{   name: 'displacementMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'displacementScale', dt: core.datatypes.FLOAT, def: 1 },
			{   name: 'displacementBias', dt: core.datatypes.FLOAT, def: 1 },

			{   name: 'roughnessMap', dt: core.datatypes.TEXTURE, def: undefined },

			{   name: 'metalnessMap', dt: core.datatypes.TEXTURE, def: undefined },

			{   name: 'alphaMap', dt: core.datatypes.TEXTURE, def: undefined },

			{   name: 'envMap', dt: core.datatypes.CUBETEXTURE, def: undefined },
			{   name: 'envMapIntensity', dt: core.datatypes.FLOAT, def: 1 },

			{   name: 'refractionRatio', dt: core.datatypes.FLOAT, def: 0.98 },

			{	name: 'wireframe', dt: core.datatypes.BOOL },
			{	name: 'fog', dt: core.datatypes.BOOL, def: true,
				desc: 'Define whether the material color is affected by global fog settings.'
			},
			{	name: 'shading', dt: core.datatypes.FLOAT, def: 2,
				desc: 'Define shading type. 0 = No Shading, '+
				'1 = Flat Shading, 2 = Smooth Shading.'
			},
		].concat(this.input_slots)
	}

	ThreeStandardMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

	ThreeStandardMaterialPlugin.prototype.reset = function() {
		AbstractThreeMaterialPlugin.prototype.reset.call(this)
		this.material = new THREE.MeshStandardMaterial()
	}

	ThreeStandardMaterialPlugin.prototype.update_input = function(slot, data) {
		if (slot.name === 'normalScale' && data !== undefined) {
			// set Vector2 from Vector3
			this.material.normalScale.set(data.x, data.y)

			return
		}

		AbstractThreeMaterialPlugin.prototype.update_input.apply(this, arguments)
	}

})()

