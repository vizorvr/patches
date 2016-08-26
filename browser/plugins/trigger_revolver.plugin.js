(function() {

var TriggerRevolver = E2.plugins.trigger_revolver = function TriggerRevolver(core, node) {
	var that = this
	
	this.desc = 'Revolver style array switch. Set up n inputs, then choose which one to output.';
	
	this.input_slots = [ 
		{ name: 'trigger', dt: E2.dt.BOOL, desc: 'Select next input.', def: false }
	]
	
	this.output_slots = [
		{ name: 'value', dt: E2.dt.ANY, desc: 'Emits the selected input.' },
		{ name: 'length', dt: E2.dt.FLOAT, desc: 'Emits the number of inputs = the length of the array.' }
	]

	this.core = core
	this.node = node
	this.lsg = new LinkedSlotGroup(core, node, [], [this.output_slots[0]])

	this.number = 0
	this.values = []

	this.node.on('slotAdded', function() {
		that.dynInputs = node.getDynamicInputSlots()
		that.updated = true
	})

	this.node.on('slotRemoved', function() {
		that.dynInputs = node.getDynamicInputSlots()
		that.updated = true
	})
}

TriggerRevolver.prototype.create_ui = function() {
	var that = this
	var layout = make('div')
	var removeButton = makeButton('Remove', 'Click to remove the last input.')
	var addButton = makeButton('Add', 'Click to add another input.')
	
	removeButton.css('width', '65px')
	addButton.css({ 'width': '65px', 'margin-top': '5px' })
	
	addButton.click(function() {
		E2.app.graphApi.addSlot(that.node.parent_graph, that.node, {
			type: E2.slot_type.input,
			name: that.dynInputs.length + '',
			dt: that.lsg.dt
		})
	})

	removeButton.click(function() {
		var inputs = that.dynInputs
		if (!inputs)
			return

		var suid = inputs[inputs.length - 1].uid
		E2.app.graphApi.removeSlot(that.node.parent_graph, that.node, suid)
	})

	layout.append(removeButton, '<br />', addButton);
	
	return layout
}

TriggerRevolver.prototype.update_input = function(slot, data) {
	if (slot.uid === undefined) {
		if (data === true) {
			this.number = (this.number + 1) % this.dynInputs.length

			for (var i=0; i < this.dynInputs.length; i++)
				this.dynInputs[i].inactive = (i !== this.number)

			return
		}
	} else { // dynamic slot
		this.values[slot.index] = data
	}
}

TriggerRevolver.prototype.update_state = function() {
	if (this.number >= this.values.length) {
		this.updated = (this.value !== undefined)
		this.value = undefined
		return
	}

	if (this.value !== this.values[this.number]) {
		this.value = this.values[this.number]
		this.updated = true
	}
	else {
		this.updated = false
	}
}

TriggerRevolver.prototype.update_output = function(slot) {
	if (slot.index === 1)
		return this.dynInputs.length

	if (this.value !== undefined)
		return this.value

	var def = this.core.get_default_value(this.lsg.dt)

	return def
}

TriggerRevolver.prototype.connection_changed = function(on, conn, slot) {
	if (this.lsg.connection_changed(on, conn, slot))
		this.value = this.lsg.core.get_default_value(this.lsg.dt)
}

TriggerRevolver.prototype.state_changed = function(ui) {
	if (!ui) {
		var slots = this.dynInputs = this.node.getDynamicInputSlots()

		for(var i = 0, len = slots.length; i < len; i++) {
			this.lsg.add_dyn_slot(slots[i])
			slots[i].inactive = false
		}
		
		this.number = 0
		this.value = this.lsg.infer_dt()
	}
};


})();

