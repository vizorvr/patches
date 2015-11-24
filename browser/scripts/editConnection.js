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
	var adt = slot.dt.id, bdt
	var otherSlot
	var rtl = this.rightToLeft
	var anyDt = E2.dt.ANY.id

	if (rtl) {
		bdt = this.dstSlot.dt.id
		otherSlot = this.dstSlot
	} else {
		bdt = this.srcSlot.dt.id
		otherSlot = this.srcSlot
	}

	// Only allow connection if datatypes match and slot is unconnected. 
	// Don't allow self-connections. There is no complete check for cyclic 
	// redundacies, though we should probably institute one.
	var a = (adt === bdt || adt === anyDt || bdt === anyDt)

	// don't allow connections between two ANY slots.
	var b = !(adt === anyDt && bdt === anyDt)
	
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
	var dfd = when.defer()
	var that = this

	if (this.connection.src_slot && this.connection.dst_slot &&
		(this.srcSlot !== this.connection.src_slot || this.dstSlot !== this.connection.dst_slot))
	{
		// connection changed or removed
		E2.app.graphStore.once('disconnected:'+this.connection.uid, function() {
			dfd.resolve(that.connection)
		})

		this.graphApi.disconnect(E2.core.active_graph, this.connection)
	} else if (!this.isConnectable()) {
		dfd.reject('Not connectable')
	} else if (this.isConnectable() && 
		this.connection.src_slot === this.srcSlot &&
		this.connection.dst_slot === this.dstSlot)
	{
		dfd.reject('Not connectable: same source or destination')
	} else {
		// new connection
		this.connection.src_node = this.srcNode
		this.connection.dst_node = this.dstNode
		this.connection.src_slot = this.srcSlot
		this.connection.dst_slot = this.dstSlot
		this.connection.uid = E2.uid()

		E2.app.graphStore.once('connected:'+this.connection.uid, function() {
			dfd.resolve(that.connection)
		})

		this.graphApi.connect(E2.core.active_graph,
			Connection.hydrate(E2.core.active_graph, this.connection.serialise()))
	}

	return dfd.promise
}

if (typeof(module) !== 'undefined')
	module.exports = EditConnection
