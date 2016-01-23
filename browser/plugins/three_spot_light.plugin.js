(function() {
	var ThreeSpotLightPlugin = E2.plugins.three_spot_light = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Spot Light'

		this.params = {
			color: new THREE.Color(0xffffff),
			intensity: 1.0,
			distance: 0,
			angle: Math.PI / 3,
			exponent: 10,
			decay: 1
		}

		this.input_slots = [
			{ name: 'intensity', dt: core.datatypes.FLOAT, def: this.params.intensity },
			{ name: 'color', dt: core.datatypes.COLOR, def: this.params.color },
			{ name: 'distance', dt: core.datatypes.FLOAT, def: this.params.distance },
			{ name: 'angle', dt: core.datatypes.FLOAT, def: this.params.angle },
			{ name: 'exponent', dt: core.datatypes.FLOAT, def: this.params.exponent },
			{ name: 'decay', dt: core.datatypes.FLOAT, def: this.params.decay }
		].concat(this.input_slots)
	}

	ThreeSpotLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeSpotLightPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)

		this.object3d = new THREE.SpotLight( 0xFFFFFF );

		// back reference for object picking
		this.object3d.backReference = this
	}
})()
