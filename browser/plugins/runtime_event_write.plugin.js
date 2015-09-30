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
}

RunTimeEventWritePlugin.prototype.update_input = function(slot, data) {
	if (slot.name === 'emit') {
		this.emitActive = data
		this.hasNewData = true
	}

	if (slot.name === 'eventName')
		this.eventName = data
	
	if (slot.name === 'data') {
		this.value = data
		this.hasNewData = true
	}
}

RunTimeEventWritePlugin.prototype.update_state = function() {
	if (this.hasNewData && this.eventName && this.value && this.emitActive) {
		console.log('emit ', this.eventName)
		E2.core.runtimeEvents.emit(this.eventName, this.value)

		this.hasNewData = false
	}
}

E2.plugins.runtime_event_write = RunTimeEventWritePlugin

})()