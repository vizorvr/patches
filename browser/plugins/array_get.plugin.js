var ArrayGetPlugin = E2.plugins.array_get = function ArrayGetPlugin(core, node) {
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
			name: 'item',
			dt: core.datatypes.ANY
		}
	]

	this.lsg = new LinkedSlotGroup(core, node,
		[this.input_slots[0]], [this.output_slots[0]])

	this.array = []
}

ArrayGetPlugin.prototype = Object.create(Plugin.prototype)

ArrayGetPlugin.prototype.reset = function() {
	this.item = this.lsg.infer_dt()
}

ArrayGetPlugin.prototype.connection_changed = function(on, conn, slot) {
	console.log('ArrayGetPlugin.connection_changed')
	
	if (this.lsg.connection_changed(on, conn, slot))
		this.array = this.lsg.core.get_default_value(this.lsg.dt)

	this.output_slots[0].array = false
}

ArrayGetPlugin.prototype.update_input = function(slot, data) {
	console.log('ArrayGetPlugin.update_input', slot.index, data)
	if (slot.index === 0) {
		if (data && data.length)
			this.array = data
	} else if (slot.index === 1) {
		this.item = this.array[data]
	}
}

ArrayGetPlugin.prototype.update_output = function() {
	return this.item
}

ArrayGetPlugin.prototype.state_changed = function(ui) {
	if (ui)
		return;

	this.array = []
	
	this.lsg.infer_dt()
} 
