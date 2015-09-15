var ArrayClearPlugin = E2.plugins.array_clear = function ArrayClearPlugin(core, node) {
	Plugin.apply(this, arguments)

	this.desc = 'Empties given array'

	this.input_slots = [
		{	name: 'array',
			dt: E2.dt.ANY,
			array: true,
			desc: 'Optional array to change',
			def: []
		},
		{	name: 'clear',
			dt: core.datatypes.BOOL,
			desc: 'A true signal here clears the array'
		},
	]

	this.output_slots = [ {
			name: 'array',
			dt: E2.dt.ANY,
			array: true,
		}
	]

	this.lsg = new LinkedSlotGroup(core, node, 
		[this.input_slots[0]],
		[this.output_slots[0]])

	this.array = []
	this.index = 0
}

ArrayClearPlugin.prototype = Object.create(Plugin.prototype)

ArrayClearPlugin.prototype.reset = function() {}

ArrayClearPlugin.prototype.update_input = function(slot, data) {
	if (slot.index === 0) {
		this.array = data ? data : this.array
	} else if (slot.index === 1) {
		if (data === true)
			this.array = []
	}
}

ArrayClearPlugin.prototype.update_output = function() {
	return this.array
}

ArrayClearPlugin.prototype.state_changed = function(ui) {
	if (ui)
		return;

	this.array = []
	
	this.lsg.infer_dt()
} 
