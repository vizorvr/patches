(function() {
	var ThreeLineMaterialPlugin = E2.plugins.three_line_material = function(core) {
		AbstractThreeMaterialPlugin.apply(this, arguments)

		this.desc = 'THREE.js Line Material'

		this.input_slots = [
			{	name: 'color', dt: core.datatypes.COLOR },
			{   name: 'linewidth', dt: core.datatypes.FLOAT, def: 1.0 },
			{	name: 'fog', dt: core.datatypes.BOOL, def: true,
				desc: 'Define whether the material color is affected by global fog settings.'
			},
		].concat(this.input_slots)

		this.output_slots = [{
			name: 'material',
			dt: core.datatypes.MATERIAL
		}]
	}

	ThreeLineMaterialPlugin.prototype = Object.create(AbstractThreeMaterialPlugin.prototype)

	ThreeLineMaterialPlugin.prototype.reset = function() {
		AbstractThreeMaterialPlugin.prototype.reset.call(this)
		this.material = new THREE.LineBasicMaterial()
	}

})()

