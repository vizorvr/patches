(function() {
	var ThreePhongMaterialPlugin = E2.plugins.three_material_phong = function(core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)
		
		this.desc = 'THREE.js Phong Material'
		
		this.input_slots = [
			{	name: 'texture', dt: core.datatypes.TEXTURE },
			{   name: 'lightMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'bumpMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'normalMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'specularMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'displacementMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'alphaMap', dt: core.datatypes.TEXTURE, def: undefined },
			{	name: 'color', dt: core.datatypes.COLOR, def: new THREE.Color(0xffffff) },
			{	name: 'wireframe', dt: core.datatypes.BOOL },
			{	name: 'fog', dt: core.datatypes.BOOL, def: true,
				desc: 'Define whether the material color is affected by global fog settings.'
			},
			{	name: 'shading', dt: core.datatypes.FLOAT, def: 2,
				desc: 'Define shading type. 0 = No Shading, '+
					'1 = Flat Shading, 2 = Smooth Shading.'
			},
		].concat(this.input_slots).concat([
			{	name: 'emissiveMap', dt: core.datatypes.TEXTURE, def: undefined },
			{	name: 'emissive', dt: core.datatypes.COLOR, def: new THREE.Color(0) },
			{	name: 'specular', dt: core.datatypes.COLOR, def: new THREE.Color(0x111111) },
			{	name: 'shininess', dt: core.datatypes.FLOAT, def: 30 },
			{	name: 'metal', dt: core.datatypes.BOOL, def: false },
			{   name: 'lightMapIntensity', dt: core.datatypes.FLOAT, def: 1 },
			{   name: 'normalScale', dt: core.datatypes.VECTOR, def: new THREE.Vector3(1, 1, 1) },
			{   name: 'bumpScale', dt: core.datatypes.FLOAT, def: 1 },
			{   name: 'displacementScale', dt: core.datatypes.FLOAT, def: 1 },
			{   name: 'displacementBias', dt: core.datatypes.FLOAT, def: 1 },
			{   name: 'reflectivity', dt: core.datatypes.FLOAT, def: 1 },
			{   name: 'refractionRatio', dt: core.datatypes.FLOAT, def: 0.98 }
		])
	}

	ThreePhongMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

	ThreePhongMaterialPlugin.prototype.reset = function() {
		AbstractThreeMaterialPlugin.prototype.reset.call(this)
		this.material = new THREE.MeshPhongMaterial()
	}

	ThreePhongMaterialPlugin.prototype.update_input = function(slot, data) {
		if (slot.name === 'normalScale' && data !== undefined) {
			// set Vector2 from Vector3
			this.material.normalScale.set(data.x, data.y)

			return
		}

		AbstractThreeMaterialPlugin.prototype.update_input.apply(this, arguments)
	}

})()

