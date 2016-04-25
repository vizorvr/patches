(function() {
	var ThreePointCloudMaterialPlugin = E2.plugins.three_point_cloud_material = function(core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)

		this.desc = 'THREE.js Point Cloud Material'

		this.input_slots = [
			{	name: 'texture', dt: core.datatypes.TEXTURE },
			{	name: 'color', dt: core.datatypes.COLOR, def: new THREE.Color(0xffffff) },
			{   name: 'size', dt: core.datatypes.FLOAT, def: 1.0 },
			{   name: 'sizeAttenuation', dt: core.datatypes.FLOAT, def: 1.0 },
			{	name: 'fog', dt: core.datatypes.BOOL, def: true,
				desc: 'Define whether the material color is affected by global fog settings.'
			},
			{   name: 'depthTest', dt: core.datatypes.BOOL, def: true}
		].concat(this.input_slots)

		this.output_slots = [{
			name: 'material',
			dt: core.datatypes.MATERIAL
		}]
	}

	ThreePointCloudMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

	ThreePointCloudMaterialPlugin.prototype.reset = function() {
		AbstractThreeMaterialPlugin.prototype.reset.call(this)
		this.material = new THREE.PointCloudMaterial()
	}

})()

