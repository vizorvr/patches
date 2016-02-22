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

		this.always_update = true
	}

	ThreeDirectionalLightPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	ThreeDirectionalLightPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this, arguments)

		this.setObject3D(new THREE.DirectionalLight( 0xffffff, this.params.intensity ))
	}

	ThreeDirectionalLightPlugin.prototype.update_state = function() {
		var directionVector = new THREE.Vector3(0, -1, 0)
		directionVector.applyMatrix4(this.object3d.matrixWorld)
		this.object3d.target.position.copy(directionVector)
		this.object3d.target.updateMatrixWorld()

		return ThreeObject3DPlugin.prototype.update_state.apply(this, arguments)
	}

	// disable scaling, it doesn't make sense for lights
	ThreeDirectionalLightPlugin.prototype.canEditScale = function() {
		return false
	}

})()

