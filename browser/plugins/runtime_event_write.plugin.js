(function() {

function RunTimeEventWritePlugin() {
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

	this.desc = 'Emit a single runtime event when the data-input changes ' +
				'behaviour can be controlled by the emit-input. When emit becomes ' +
				'true, any data not yet sent will be emitted.'
}

RunTimeEventWritePlugin.prototype.update_input = function(slot, data) {
	if (slot.name === 'emit') {
		this.emitActive = data
	}

	if (slot.name === 'eventName') {
		this.eventName = data
	}

	if (slot.name === 'data') {
		this.value = data
	}

	this.hasNewData = true
}

RunTimeEventWritePlugin.prototype.update_state = function() {
	if (this.hasNewData && this.eventName && this.value !== undefined && this.emitActive) {
		E2.core.runtimeEvents.emit(this.eventName, this.value)

		this.hasNewData = false
	}
}

E2.plugins.runtime_event_write = RunTimeEventWritePlugin

})()