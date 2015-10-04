(function() {
	var ThreeDirectionalLightPlugin = E2.plugins.three_directional_light = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Directional Light'

		this.params = {
			color: new THREE.Color(0xffffff),
			intensity: 1.0
		}

		this.input_slots = [
			{ name: 'intensity', dt: core.datatypes.FLOAT, def: this.params.intensity },
			{ name: 'color', dt: core.datatypes.COLOR, def: this.params.color }
		].concat(this.input_slots)
	}

	ThreeDirectionalLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeDirectionalLightPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this, arguments)

		this.object3d = new THREE.DirectionalLight( 0xFFFFFF, this.params.intensity ); // soft white light

		// back reference for object picking
		this.object3d.backReference = this
	}
})()

