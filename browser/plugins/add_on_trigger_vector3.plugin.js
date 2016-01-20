(function() {
	var AddOnTriggerVector3 = E2.plugins.add_on_trigger_vector3 = function(core, node) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'trigger',
			dt: E2.dt.BOOL,
			desc: 'On true, this plugin will output A + B, otherwise A'
		}, {
			name: 'A',
			dt: E2.dt.VECTOR
		}, {
			name: 'B',
			dt: E2.dt.VECTOR
		}]

		this.output_slots = [{
			name: 'value',
			dt: E2.dt.VECTOR,
			desc: 'if trigger is true, will output A + B, otherwise A'
		}]

		this.value = new THREE.Vector3()
	}

	AddOnTriggerVector3.prototype = Object.create(Plugin.prototype)

	AddOnTriggerVector3.prototype.update_state = function() {
		this.value.copy(this.inputValues.A)

		if (this.inputValues.trigger) {
			this.value.add(this.inputValues.B)
		}
	}

	AddOnTriggerVector3.prototype.update_output = function(slot) {
		return this.value
	}
})()