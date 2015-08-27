(function() {
	var ThreeAmbientLightPlugin = E2.plugins.three_ambient_light = function() {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Ambient Light'
	}

	ThreeAmbientLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeAmbientLightPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)
		this.object3d = new THREE.AmbientLight( 0x777777 ); // soft white light

		// back reference for object picking
		this.object3d.backReference = this
	}

})()

