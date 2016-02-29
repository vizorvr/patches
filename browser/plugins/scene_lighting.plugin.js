(function() {
	var SceneLightingPlugin = E2.plugins.scene_lighting = function(core) {
		ThreeObject3DPlugin.apply(this, arguments)

		this.desc = 'Scene Lighting'

		this.params = {
			intensity: 1.0,
			lightColor: new THREE.Color(0x147DCC),
			groundColor: new THREE.Color(0x666739),
			skyColor: new THREE.Color(0),
		}

		this.input_slots = [
			{ name: 'intensity', dt: core.datatypes.FLOAT, def: this.params.intensity },
			{ name: 'directional light color', dt: core.datatypes.COLOR, def: this.params.lightColor },
			{ name: 'sky light color', dt: core.datatypes.COLOR, def: this.params.skyColor },
			{ name: 'ground light color', dt: core.datatypes.COLOR, def: this.params.groundColor },
			{ name: 'shadow radius', dt: core.datatypes.FLOAT, def: 1 },
			{ name: 'shadow darkness', dt: core.datatypes.FLOAT, def: 1}
		].concat(this.input_slots)

		this.always_update = true
	}

	SceneLightingPlugin.prototype = Object.create(ThreeObject3DPlugin.prototype)

	SceneLightingPlugin.prototype.reset = function() {
		ThreeObject3DPlugin.prototype.reset.apply(this)

		if (!this.hemisphereLight) {
			this.hemisphereLight = new THREE.HemisphereLight(this.params.skyColor, this.params.groundColor)
			this.directionalLight = new THREE.DirectionalLight(this.params.lightColor, this.params.intensity)

			this.directionalLight.intensity = this.inputValues.intensity
			this.directionalLight.shadow.radius = this.inputValues['shadow radius']
			this.directionalLight.shadow.darkness = this.inputValues['shadow darkness']

			this.hemisphereLight.add(this.directionalLight)

			this.setObject3D(this.hemisphereLight)
		}
	}

	SceneLightingPlugin.prototype.update_state = function() {
		ThreeObject3DPlugin.prototype.update_state.apply(this, arguments)

		this.object3d.updateMatrixWorld()
		var directionVector = new THREE.Vector3(0, -1, 0)
		directionVector.applyMatrix4(this.directionalLight.matrixWorld)
		this.directionalLight.target.position.copy(directionVector)
		this.directionalLight.target.updateMatrixWorld()
	}

	SceneLightingPlugin.prototype.update_input = function(slot, data) {
		if(slot.name === 'directional light color') {
			this.directionalLight.color.copy(data)
		}
		else if (slot.name === 'ground light color') {
			this.hemisphereLight.groundColor.copy(data)
		}
		else if (slot.name === 'sky light color') {
			this.hemisphereLight.color.copy(data)
		}
		else if (slot.name === 'intensity') {
			this.directionalLight.intensity = data
		}
		else if (slot.name === 'shadow radius') {
			this.directionalLight.shadow.radius = data
		}
		else if (slot.name === 'shadow darkness') {
			this.directionalLight.shadow.darkness = data
		}
		else {
			ThreeObject3DPlugin.prototype.update_input.apply(this, arguments)
		}
	}

	SceneLightingPlugin.prototype.update_output = function() {
		return this.object3d
	}

	// disable scaling, it doesn't make sense for lights
	SceneLightingPlugin.prototype.canEditScale = function() {
		return false
	}
})()
