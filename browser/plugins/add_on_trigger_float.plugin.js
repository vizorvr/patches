(function() {
	var AddOnTriggerFloat = E2.plugins.add_on_trigger_float = function(core, node) {
		Plugin.apply(this, arguments)

		this.input_slots = [{
			name: 'trigger',
			dt: E2.dt.BOOL,
			desc: 'On true, this plugin will output A + B, otherwise A'
		}, {
			name: 'A',
			dt: E2.dt.FLOAT
		}, {
			name : 'B',
			dt: E2.dt.FLOAT
		}]

		this.output_slots = [{
			name: 'value',
			dt: E2.dt.FLOAT,
			desc: 'if trigger is true, will output A + B, otherwise A'
		}]
	}

	AddOnTriggerFloat.prototype = Object.create(Plugin.prototype)

	AddOnTriggerFloat.prototype.update_output = function(slot) {
		return this.inputValues.trigger ? (this.inputValues.A + this.inputValues.B) : this.inputValues.A
	}
})()