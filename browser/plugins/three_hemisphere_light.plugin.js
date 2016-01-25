(function() {
	var ThreeHemisphereLightPlugin = E2.plugins.three_hemisphere_light = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Hemisphere Light'

		this.params = {
			skyColor: new THREE.Color(0xffffff),
			groundColor: new THREE.Color(0x684f40),
			intensity: 1.0
		}

		this.input_slots = [
			{ name: 'intensity', dt: core.datatypes.FLOAT, def: this.params.intensity },
			{ name: 'color', dt: core.datatypes.COLOR, def: this.params.skyColor },
			{ name: 'groundColor', dt: core.datatypes.COLOR, def: this.params.groundColor },
		].concat(this.input_slots)
	}

	ThreeHemisphereLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeHemisphereLightPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)

		this.object3d = new THREE.HemisphereLight( this.params.skyColor, this.params.groundColor );

		// back reference for object picking
		this.object3d.backReference = this
	}

})()
