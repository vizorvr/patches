var ValueChangePlugin = E2.plugins.change_trigger = function ValueChangePlugin(core, node) {
	Plugin.apply(this, arguments)

	this.desc = 'Triggers the output once when input changes'

	this.input_slots = [
		{
			name: 'value',
			dt: core.datatypes.ANY,
			desc: 'Item to watch'
		},
	]

	this.output_slots = [ {
			name: 'bool',
			dt: core.datatypes.BOOL,
			desc: 'Triggered for one frame when input value changes'
		}
	]

	this.value = null
	this.changed = false
}

ValueChangePlugin.prototype = Object.create(Plugin.prototype)

ValueChangePlugin.prototype.reset = function() {
	this.changed = false
}

ValueChangePlugin.prototype.update_input = function(slot, data) {
	if (data === this.value)
		return;

	this.value = data
	this.node.queued_update = 1
}

ValueChangePlugin.prototype.update_state = function() {
	this.changed = this.value !== this.previousValue
	this.previousValue = this.value
}

ValueChangePlugin.prototype.update_output = function() {
	return this.changed
}
