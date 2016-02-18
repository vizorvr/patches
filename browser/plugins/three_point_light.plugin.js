(function() {
	var ThreePointLightPlugin = E2.plugins.three_point_light = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Point Light'

		this.params = {
			color: new THREE.Color(0xffffff),
			intensity: 1.0,
			distance: 0.0,
			decay: 1.0
		}

		this.input_slots = [
			{ name: 'intensity', dt: core.datatypes.FLOAT, def: this.params.intensity },
			{ name: 'distance', dt: core.datatypes.FLOAT, def: this.params.distance },
			{ name: 'decay', dt: core.datatypes.FLOAT, def: this.params.decay },
			{ name: 'color', dt: core.datatypes.COLOR, def: this.params.color }
		].concat(this.input_slots)

		// disable shadows by default for point lights - they're slow
		this.input_slots.map(function(input) {
			if (input.name === 'castShadow') {
				input.def = false
			}
			else if (input.name === 'receiveShadow') {
				input.def = false
			}
		})
	}

	ThreePointLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreePointLightPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)

		this.setObject3D(new THREE.PointLight( 0xFFFFFF )) // soft white light
	}

	// disable scaling, it doesn't make sense for lights
	ThreePointLightPlugin.prototype.canEditScale = function() {
		return false
	}

})()

