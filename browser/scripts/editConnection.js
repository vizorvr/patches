function EditConnection(graphApi, connection, sdiv, ddiv) {
	this.offset = 0
	this.graphApi = graphApi
	this.srcNode = connection.src_node
	this.srcSlot = connection.src_slot
	this.srcSlotDiv = sdiv
	this.dstNode = connection.dst_node
	this.dstSlot = connection.dst_slot
	this.dstSlotDiv = ddiv
	this.connection = connection
	this.rightToLeft = !!this.dstNode && !this.srcNode

	var c = this.connection
	this.ui = c.ui ? c.ui : c.create_ui()
}

EditConnection.prototype.hoverSlot = function(node, slot) {
	var can = this.canConnectTo(node, slot)

	if (!can)
		return false

	if (this.rightToLeft) {
		this.srcNode = node
		this.srcSlot = slot
	} else {
		this.dstNode = node
		this.dstSlot = slot
	}

	return can
}

EditConnection.prototype.blurSlot = function(slot) {
	if (this.rightToLeft) {
		if (slot === this.dstSlot)
			return;
		this.srcNode = null
		this.srcSlot = null
	} else {
		if (slot === this.srcSlot)
			return;
		this.dstNode = null
		if (this.dstSlot)
			this.dstSlot.is_connected = false
		this.dstSlot = null
	}
}

EditConnection.prototype.destroy_ui = function() {
	this.connection.destroy_ui()
}

EditConnection.prototype.canConnectTo = function(node, slot) {
	var adt = slot.dt, bdt
	var otherSlot
	var rtl = this.rightToLeft

	if (rtl) {
		bdt = this.dstSlot.dt
		otherSlot = this.dstSlot
	} else {
		bdt = this.srcSlot.dt
		otherSlot = this.srcSlot
	}

	// Only allow connection if datatypes match and slot is unconnected. 
	// Don't allow self-connections. There is no complete check for cyclic 
	// redundacies, though we should probably institute one.
	var a = (adt === bdt || adt === E2.dt.ANY || bdt === E2.dt.ANY)

	// don't allow connections between two ANY slots.
	var b = !(adt === E2.dt.ANY && bdt === E2.dt.ANY)
	
	// dest to source, and source is slot and dest isn't slot
	var c = (rtl &&
				(!this.srcSlot || this.srcSlot === slot) &&
				this.dstNode !== node) ||
			(!rtl && !slot.is_connected &&
				(!this.dstSlot || this.dstSlot === slot) &&
				this.srcNode !== node)

	// don't allow connections from output to output
	var d = slot.type !== otherSlot.type

	var can = a && b && c && d

	if (can) {
		this._lastMatch = [node, slot]
	} else {
		this._lastMatch = []
	}

	return can
}

EditConnection.prototype.isValid = function() {
	return this.canConnectTo(this._lastMatch[0], this._lastMatch[1])
}

EditConnection.prototype.isConnectable = function() {
	return this.srcNode && this.srcSlot && this.dstNode && this.dstSlot
}

EditConnection.prototype.commit = function() {
	if (this.isConnectable() && this.connection.src_slot === this.srcSlot &&
		this.connection.dst_slot === this.dstSlot) 
		return; 

	// connection changed or removed?
	if (this.connection.src_slot && this.connection.dst_slot &&
		(this.srcSlot !== this.connection.src_slot || this.dstSlot !== this.connection.dst_slot)) {
		this.graphApi.disconnect(E2.core.active_graph, this.connection)
	}

	if (!this.isConnectable())
		return;

	this.connection.src_node = this.srcNode
	this.connection.dst_node = this.dstNode
	this.connection.src_slot = this.srcSlot
	this.connection.dst_slot = this.dstSlot
	this.connection.uid = E2.uid()

	return this.graphApi.connect(E2.core.active_graph,
		Connection.hydrate(E2.core.active_graph, this.connection.serialise()))
}

if (typeof(module) !== 'undefined')
	module.exports = EditConnection
