(function() {
	var ThreeAmbientLightPlugin = E2.plugins.three_ambient_light = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Ambient Light'

		this.input_slots = [

		].concat(this.input_slots)

		this.output_slots = [{
			name: 'object3d',
			dt: core.datatypes.OBJECT3D
		}]
	}

	ThreeAmbientLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeAmbientLightPlugin.prototype.reset = function() {
		this.object3d = new THREE.AmbientLight( 0x777777 ); // soft white light

		// back reference for object picking
		this.object3d.backReference = this
	}

	ThreeAmbientLightPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
		default:
			return ThreeObject3DPlugin.prototype.update_input
			.apply(this, arguments)
		}
	}

})()

