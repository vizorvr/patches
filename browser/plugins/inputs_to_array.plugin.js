(function() {

var InputsToArray = E2.plugins.inputs_to_array = function InputsToArray(core, node) {
	var that = this
	
	this.desc = 'Combine all the input slots into an output array of the same datatype'

	this.input_slots = []
	
	this.output_slots = [
		{
			name: 'array',
			dt: E2.dt.ANY,
			array: true,
			desc: 'The array.'
		},
		{
			name: 'length',
			dt: E2.dt.FLOAT,
			desc: 'The number of inputs ie. the length of the array.'
		}
	]

	this.core = core
	this.node = node
	this.lsg = new AutoSlotGroup(core, node, [], [this.output_slots[0]])

	this.array = []

	this.node.on('slotAdded', function() {
		that.dynInputs = node.getDynamicInputSlots()
		that.updated = true
	})

	this.node.on('slotRemoved', function() {
		that.dynInputs = node.getDynamicInputSlots()
		that.updated = true
	})
}

InputsToArray.prototype.update_input = function(slot, data) {
	if (data === null || data === undefined)
		delete this.array[slot.index]
	else if (data instanceof Array)
		this.array[slot.index] = data[0]
	else
		this.array[slot.index] = data
}

InputsToArray.prototype.update_output = function(slot) {
	if (slot.index === 1)
		return this.dynInputs.length - 1

	return this.array
}

InputsToArray.prototype.connection_changed = function(on, conn, slot) {
	if (this.lsg.connection_changed(on, conn, slot))
		this.lsg.infer_dt()

	this.updated = true
}

InputsToArray.prototype.state_changed = function(ui) {
	if (!ui) {
		this.dynInputs = this.node.getDynamicInputSlots()

		if (!this.dynInputs.length) {
			this.node.add_slot(E2.slot_type.input, {
				name: '0',
				dt: E2.dt.ANY,
				array: false
			})
	
			this.dynInputs = this.node.getDynamicInputSlots()
		}

		for(var i = 0, len = this.dynInputs.length; i < len; i++) {
			this.lsg.add_dyn_slot(this.dynInputs[i])
		}

		this.lsg.infer_dt()
	}
}


})();

