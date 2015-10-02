(function() {

	function RunTimeEventWriteContinuousPlugin() {
		this.input_slots = [{
			name: 'emit',
			dt: E2.dt.BOOL,
			desc: 'disable / enable emitting',
			def: true
		},
		{
			name: 'eventName',
			dt: E2.dt.TEXT
		},
		{
			name: 'data',
			dt: E2.dt.ANY
		}]

		this.output_slots = []

		this.desc = 'Emit one event on every frame for as long as ' +
					'the emit-input remaing true.'
	}

	RunTimeEventWriteContinuousPlugin.prototype.update_input = function(slot, data) {
		if (slot.name === 'emit') {
			this.emitActive = data
		}

		if (slot.name === 'eventName') {
			this.eventName = data
		}

		if (slot.name === 'data') {
			this.value = data
		}
	}

	RunTimeEventWriteContinuousPlugin.prototype.update_state = function() {
		if (this.eventName && this.value && this.emitActive) {
			E2.core.runtimeEvents.emit(this.eventName, this.value)
		}
	}

	E2.plugins.runtime_event_write_continuous = RunTimeEventWriteContinuousPlugin

})()