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

		this.setObject3D(new THREE.AmbientLight( 0x777777 )) // soft white light
	}

	ThreeAmbientLightPlugin.prototype.update_input = function(slot, data) {
		if (!this.object3d)
			return;

		this.object3d.color = data
	}

	// disable scaling & quaternion, they don't make sense for ambient lights
	// (position doesn't either but we'll keep it so that the helper can
	// be moved out of the way)
	ThreeAmbientLightPlugin.prototype.canEditScale = function() {
		return false
	}

	ThreeAmbientLightPlugin.prototype.canEditQuaternion = function() {
		return false
	}

})()

