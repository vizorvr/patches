(function() {
	var ThreeLambertMaterialPlugin = E2.plugins.three_material_lambert = function(core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)
		
		this.desc = 'THREE.js Lambert Material'
		
		this.input_slots = [
			{	name: 'texture', dt: core.datatypes.TEXTURE },
			{	name: 'color', dt: core.datatypes.COLOR },
			{	name: 'lightMap', dt: core.datatypes.TEXTURE },
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

	ThreeLambertMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

	ThreeLambertMaterialPlugin.prototype.reset = function() {
		AbstractThreeMaterialPlugin.prototype.reset.call(this)
		this.material = new THREE.MeshLambertMaterial()
	}

})()

