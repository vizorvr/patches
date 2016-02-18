(function() {
	var ThreeAmbientLightPlugin = E2.plugins.three_ambient_light = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.input_slots = [
			{ name: 'color', dt: core.datatypes.COLOR }
		]

		this.desc = 'THREE.js Ambient Light'
	}

	ThreeAmbientLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeAmbientLightPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)
		this.object3d = new THREE.AmbientLight( 0x777777 ); // soft white light

		// back reference for object picking
		this.object3d.backReference = this
	}

	ThreeAmbientLightPlugin.prototype.update_input = function(slot, data) {
		if (!this.object3d)
			return;

		this.object3d.color = data
	}

})()

