(function() {
	var SceneLightingPlugin = E2.plugins.scene_lighting = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'Scene Lighting'

		this.params = {
			intensity: 1.0,
			ambientColor: new THREE.Color(0),
			lightColor: new THREE.Color(0x147DCC),
			groundColor: new THREE.Color(0x666739),
			skyColor: new THREE.Color(0),
		}

		this.input_slots = [
			{ name: 'intensity', dt: core.datatypes.FLOAT, def: this.params.intensity },
			{ name: 'ambient color', dt: core.datatypes.COLOR, def: this.params.ambientColor },
			{ name: 'light color', dt: core.datatypes.COLOR, def: this.params.lightColor },
			{ name: 'ground color', dt: core.datatypes.COLOR, def: this.params.groundColor },
			{ name: 'sky color', dt: core.datatypes.COLOR, def: this.params.skyColor },
			{ name: 'shadow radius', dt: core.datatypes.FLOAT, def: 1 }
		].concat(this.input_slots)

		this.always_update = true
	}

	SceneLightingPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	SceneLightingPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)

		if (!this.ambientLight) {
			this.ambientLight = new THREE.AmbientLight(this.params.ambientColor)
			this.hemisphereLight = new THREE.HemisphereLight(this.params.skyColor, this.params.groundColor)
			this.directionalLight = new THREE.DirectionalLight(this.params.lightColor, this.params.intensity)

			this.ambientLight.add(this.hemisphereLight)
			this.ambientLight.add(this.directionalLight)

			this.setObject3D(this.ambientLight)
		}
	}

	SceneLightingPlugin.prototype.update_state = function() {
		this.directionalLight.updateMatrixWorld()
		var directionVector = new THREE.Vector3(0, -1, 0)
		directionVector.applyMatrix4(this.directionalLight.matrixWorld)
		this.directionalLight.target.position.copy(directionVector)
		this.directionalLight.target.updateMatrixWorld()

		return ThreeObject3DPlugin.prototype.update_state.apply(this, arguments)
	}

	SceneLightingPlugin.prototype.update_input = function(slot, data) {
		if(slot.name === 'ambient color') {
			this.ambientLight.color.copy(data)
		}
		else if(slot.name === 'light color') {
			this.directionalLight.color.copy(data)
		}
		else if (slot.name === 'ground color') {
			this.hemisphereLight.groundColor.copy(data)
		}
		else if (slot.name === 'sky color') {
			this.hemisphereLight.color.copy(data)
		}
		else if (slot.name === 'intensity') {
			this.directionalLight.intensity = data
		}
		else if (slot.name === 'shadow radius') {
			this.directionalLight.shadow.radius = data
		}
		else {
			ThreeObject3DPlugin.prototype.update_input.apply(this, arguments)
		}
	}

	SceneLightingPlugin.prototype.update_output = function() {
		return this.ambientLight
	}

	// disable scaling, it doesn't make sense for lights
	SceneLightingPlugin.prototype.canEditScale = function() {
		return false
	}
})()
