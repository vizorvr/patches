(function(){
var VariableLocalWriteConditional = E2.plugins.variable_local_write_conditional = function(core, node) {
	this.desc = 'Write to a local variable using name of the node, if the trigger is true.'
	
	this.input_slots = [{
		name: 'trigger',
		dt: E2.dt.BOOL,
		desc: 'If the trigger is true, will write to the variable. Defaults to false.',
		def: false
	}]

	this.output_slots = []

	this.trigger = false
	
	this.core = core
	this.node = node
	this.value = null
	
	if (!node.title)
		this.old_title = node.title = 'Variable ' + (node.parent_graph.variables.count() + 1)
	else
		this.old_title = node.title
}

VariableLocalWriteConditional.prototype.reset = function() {
	this.updated = true
	this.trigger = false
	this.value = null
}

VariableLocalWriteConditional.prototype.destroy = function() {
	this.variables.unlock(this, this.node.title)
}

VariableLocalWriteConditional.prototype.variable_dt_changed = function(dt, arrayness) {
	this.node.change_slot_datatype(E2.slot_type.input, this.slotId, dt, arrayness)
}

VariableLocalWriteConditional.prototype.renamed = function() {
	this.variables.unlock(this, this.old_title)
	this.target_reg(this.node.title)
}

VariableLocalWriteConditional.prototype.connection_changed = function(on, conn) {
	if (conn.dst_slot.name === 'trigger') {
		return;
	}

	this.variables.connection_changed(this.node.title, on)

	if (this.dt.id === E2.dt.ANY.id)
		this.variables.set_datatype(this.node.title, conn.src_slot.dt, conn.src_slot.array)
}

VariableLocalWriteConditional.prototype.update_input = function(slot, data) {
	if (slot.name === 'trigger')
		this.trigger = data
	else
		this.value = data

	if (this.trigger && this.value !== null)
		this.variables.write(this.node.title, this.value)
}

VariableLocalWriteConditional.prototype.target_reg = function(id) {
	var dslot = this.node.find_dynamic_slot(E2.slot_type.input, this.slotId)
	
	this.variables.lock(this, id, this.node.getSlotConnections(dslot).length)

	var r = this.variables.variables[id]
	
	if (r.dt.id !== this.core.datatypes.ANY.id)
		this.variable_dt_changed(dslot.dt, r.array)
}

VariableLocalWriteConditional.prototype.state_changed = function(ui) {
	if (!ui) {
		var inputs = this.node.getDynamicInputSlots()
		this.variables = this.node.parent_graph.variables

		if (!inputs.length) {
			this.node.add_slot(E2.slot_type.input, {
				name: 'value',
				dt: this.core.datatypes.ANY,
				desc: ''
			})

			inputs = this.node.getDynamicInputSlots()
		}

		this.dt = inputs[0].dt
		this.slotId = inputs[0].uid
		this.target_reg(this.node.title)

		if (this.dt.id !== E2.dt.ANY.id)
			this.variables.set_datatype(this.node.title, this.dt, inputs[0].array)
	}
}

})()

