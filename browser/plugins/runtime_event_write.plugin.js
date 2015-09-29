(function() {

function RunTimeEventWritePlugin() {
	this.input_slots = [{
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
	if (slot.name === 'eventName')
		this.eventName = data
	
	if (slot.name === 'data') {
		this.value = data
		
		if (this.eventName && this.value) {
			E2.core.runtimeEvents.emit(this.eventName,
				data)
		}
	}
}

E2.plugins.runtime_event_write = RunTimeEventWritePlugin

})()