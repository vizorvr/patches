var ArraySetPlugin = E2.plugins.array_set = function ArraySetPlugin(core, node) {
	Plugin.apply(this, arguments)

	this.input_slots = [
		{	name: 'array',
			dt: E2.dt.ANY,
			array: true,
			desc: 'Optional array to change',
			def: []
		},
		{	name: 'index',
			dt: core.datatypes.FLOAT,
			def: 0,
			desc: 'Index for object in array'
		},
		{	name: 'item',
			dt: core.datatypes.ANY,
			desc: 'Item to set in array at index'
		},
	]

	this.output_slots = [ {
			name: 'array',
			dt: E2.dt.ANY,
			array: true,
		}
	]

	this.lsg = new LinkedSlotGroup(core, node, 
		[this.input_slots[2]],
		[this.output_slots[0]])

	this.array = []
	this.index = 0
}

ArraySetPlugin.prototype = Object.create(Plugin.prototype)

ArraySetPlugin.prototype.reset = function() {
	this.index = 0
}

ArraySetPlugin.prototype.connection_changed = function(on, conn, slot) {
	if (slot.name === 'item') {
		slot.dt = conn.src_slot.dt
		return this.lsg.set_dt(conn.src_slot.dt)
	}

	if (this.lsg.connection_changed(on, conn, slot))
		this.array = []
}

ArraySetPlugin.prototype.update_input = function(slot, data) {
	if (!data)
		return;

	console.log('Set update_input', slot.name, data, this.array.length)

	if (slot.name === 'array') {
		this.array = data ? data : this.array
	} else if (slot.name === 'index') {
		console.log('set index to', data)
		this.index = data
	} else {
		console.log('ArraySetPlugin.update_input', this.index, data.length ? data[0] : data, this.array)
		this.array[this.index] = data.length ? data[0] : data
	}
}

ArraySetPlugin.prototype.update_output = function() {
	return this.array
}

ArraySetPlugin.prototype.state_changed = function(ui) {
	if (ui)
		return;

	this.array = []
	
	this.lsg.infer_dt()
} 
