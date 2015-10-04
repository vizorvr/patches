(function() {
	var ThreeLambertMaterialPlugin = E2.plugins.three_material_lambert = function(core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)
		
		this.desc = 'THREE.js Lambert Material'
		
		this.input_slots = [
			{	name: 'texture', dt: core.datatypes.TEXTURE },
			{   name: 'lightMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'bumpMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'normalMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'specularMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'displacementMap', dt: core.datatypes.TEXTURE, def: undefined },
			{   name: 'alphaMap', dt: core.datatypes.TEXTURE, def: undefined },
			{	name: 'color', dt: core.datatypes.COLOR },
			{	name: 'wireframe', dt: core.datatypes.BOOL, def: false },
			{	name: 'fog', dt: core.datatypes.BOOL, def: true,
				desc: 'Define whether the material color is affected by global fog settings.'
			},
			{	name: 'shading', dt: core.datatypes.FLOAT, def: 2,
				desc: 'Define shading type. 0 = No Shading, '+
					'1 = Flat Shading, 2 = Smooth Shading.'
			}
		].concat(this.input_slots)
	}

	ThreeLambertMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

	ThreeLambertMaterialPlugin.prototype.reset = function() {
		AbstractThreeMaterialPlugin.prototype.reset.call(this)
		this.material = new THREE.MeshLambertMaterial()
	}

})()

