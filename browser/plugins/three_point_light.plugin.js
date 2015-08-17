(function() {
	var ThreePointLightPlugin = E2.plugins.three_point_light = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'THREE.js Point Light'

		this.params = {/*color: core.renderer.color_white, */intensity: 1.0, distance: 0.0, decay: 1.0}

		this.input_slots = [
			{ name: 'intensity', dt: core.datatypes.FLOAT, def: this.params.intensity },
			{ name: 'distance', dt: core.datatypes.FLOAT, def: this.params.distance },
			{ name: 'decay', dt: core.datatypes.FLOAT, def: this.params.decay }
			//{ name: 'color', dt: core.datatypes.COLOR, def: this.params.color },
		].concat(this.input_slots)

		this.output_slots = [{
			name: 'object3d',
			dt: core.datatypes.OBJECT3D
		}]
	}

	ThreePointLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreePointLightPlugin.prototype.reset = function() {
		this.object3d = new THREE.PointLight( 0xFFFFFF ); // soft white light

		// back reference for object picking
		this.object3d.backReference = this
	}

	ThreePointLightPlugin.prototype.update_input = function(slot, data) {
		switch(slot.index) {
		case 0: // intensity
			this.object3d.intensity = data
			break;
		case 1: // distance
			this.object3d.distance = data
			break;
		case 2: // decay
			this.object3d.decay = data
			break;
		default:
			return ThreeObject3DPlugin.prototype.update_input
			.apply(this, arguments)
		}
	}

})()

