var ArrayRemovePlugin = E2.plugins.array_remove = function ArrayRemovePlugin(core, node) {
	Plugin.apply(this, arguments)

	this.input_slots = [
		{
			name: 'array',
			dt: E2.dt.ANY,
			array: true,
			desc: 'Optional array to change',
			def: []
		},
		{
			name: 'index',
			dt: core.datatypes.FLOAT,
			def: 0,
			desc: 'Index for object in array'
		}
	]

	this.output_slots = [ {
			name: 'array',
			dt: E2.dt.ANY,
			array: true,
		}
	]

	this.lsg = new LinkedSlotGroup(core, node, [this.input_slots[0]], [this.output_slots[0]])

	this.array = []
}

ArrayRemovePlugin.prototype = Object.create(Plugin.prototype)

ArrayRemovePlugin.prototype.reset = function() {
	this.array = this.lsg.infer_dt()
}

ArrayRemovePlugin.prototype.connection_changed = function(on, conn, slot) {
	console.log('ArrayRemovePlugin.connection_changed')
	if (this.lsg.connection_changed(on, conn, slot))
		this.array = this.lsg.core.get_default_value(this.lsg.dt)
}

ArrayRemovePlugin.prototype.update_input = function(slot, data) {
	console.log('ArrayRemovePlugin.update_input', slot.index, data)
	if (slot.index === 0) {
		if (data && data.length)
			this.array = data
	} else if (slot.index === 1) {
		this.array.splice(data, 1)
	}
}

ArrayRemovePlugin.prototype.update_output = function() {
	return this.array
}

ArrayRemovePlugin.prototype.state_changed = function(ui) {
	if (ui)
		return;

	this.array = []
	
	this.lsg.infer_dt()
} 
