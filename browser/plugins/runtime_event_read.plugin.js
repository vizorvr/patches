(function() {

function RunTimeEventReadPlugin(core, node) {
	this.input_slots = [{
		name: 'eventName',
		dt: E2.dt.TEXT
	}]

	this.output_slots = [
		{
			name: 'triggered',
			dt: E2.dt.BOOL
		},
		{
			name: 'data',
			dt: E2.dt.ANY
		}
	]

	this.node = node

	this.value = null
	this.frames = 0
	this.triggered = false
	this._handleMessageBound = this._handleMessage.bind(this)

	this.lsg = new LinkedSlotGroup(core, node, 
		[], [this.output_slots[0]])
}

RunTimeEventReadPlugin.prototype.connection_changed = function(on, conn, slot) {
	if (this.lsg.connection_changed(on, conn, slot))
		this.value = this.lsg.core.get_default_value(this.lsg.dt)

	this.output_slots[0].array = false
}

RunTimeEventReadPlugin.prototype._handleMessage = function(messageData) {
	this.value = messageData
	this.frames = 0
	this.triggered = true
	this.node.queued_update = 1
	this.updated = true
}

RunTimeEventReadPlugin.prototype.update_input = function(slot, data) {
	if (slot.name === 'eventName') {
		if (this.eventName) {
			E2.core.runtimeEvents.off(this.eventName,
				this._handleMessageBound)
		}

		this.eventName = data

		E2.core.runtimeEvents.on(this.eventName,
			this._handleMessageBound)
	}
}

RunTimeEventReadPlugin.prototype.update_state = function() {
	if (this.frames++ > 0) {
		this.triggered = false
		this.value = this.lsg.core.get_default_value(this.lsg.dt)
	}
}

RunTimeEventReadPlugin.prototype.update_output = function(slot) {
	if (slot.index === 0)
		return this.triggered

	return this.value
}

RunTimeEventReadPlugin.prototype.state_changed = function() {
	this.lsg.infer_dt()
	this.value = this.lsg.core.get_default_value(this.lsg.dt)
}

E2.plugins.runtime_event_read = RunTimeEventReadPlugin

})()

