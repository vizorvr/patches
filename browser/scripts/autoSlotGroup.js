function AutoSlotGroup() {
	LinkedSlotGroup.apply(this, arguments)
}

AutoSlotGroup.prototype = Object.create(LinkedSlotGroup.prototype)

AutoSlotGroup.prototype.updateFreeSlots = function() {
	var that = this
	var dynInputs = this.node.getDynamicInputSlots()

	function addSlot() {
		E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
			type: E2.slot_type.input,
			name: dynInputs.length + '',
			dt: that.dt,
			array: dynInputs.length > 0 ? dynInputs[0].array : false // take 0th slot arrayness
		})
	}

	function removeSlot() {
		var inputs = dynInputs
		if (!inputs)
			return

		var suid = inputs[inputs.length - 1].uid
		E2.app.graphApi.removeSlot(that.node.parent_graph, that.node, suid)
	}

	// remove slots until there's only one unconnected in the end
	var lastIndex = dynInputs.length - 1

	// if the last slot is connected, can't remove any slots
	if (lastIndex > 0 && !dynInputs[lastIndex].is_connected ) {
		while (lastIndex > 0 && !dynInputs[lastIndex - 1].is_connected) {
			removeSlot()
			--lastIndex
		}
	}
	else if (dynInputs.length === 0 || dynInputs[dynInputs.length - 1].is_connected) {
		// ensure there's at least one free slot in the end
		addSlot()
	}
}

