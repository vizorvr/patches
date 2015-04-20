
function EditConnection(connection, sdiv, ddiv, rtl) {
	this.offset = 0
	this.srcNode = connection.src_node
	this.srcSlot = connection.src_slot
	this.srcSlotDiv = sdiv
	this.dstNode = connection.dst_node
	this.dstSlot = connection.dst_slot
	this.dstSlotDiv = ddiv
	this.connection = connection
	this.rightToLeft = rtl || !!this.dstNode && !this.srcNode

	var c = this.connection
	this.ui = c.ui ? c.ui : c.create_ui()
}

EditConnection.prototype.destroy_ui = function() {
	this.connection.destroy_ui()
}

EditConnection.prototype.canConnectTo = function(node, slot) {
	var adt = slot.dt, bdt
	var rtl = this.rightToLeft

	if (rtl) {
		bdt = this.dstSlot.dt
	} else {
		bdt = this.srcSlot.dt
	}

	// Only allow connection if datatypes match and slot is unconnected. 
	// Don't allow self-connections. There no complete check for cyclic 
	// redundacies, though we should probably institute one.
	// Additionally, don't allow connections between two ANY slots.
	var a = (adt === bdt || adt === E2.dt.ANY || bdt === E2.dt.ANY)
	var b = !(adt === E2.dt.ANY && bdt === E2.dt.ANY)
	var c = //true
			// dest to source, and source is slot and dest isn't slot
			(rtl && (!this.srcSlot || this.srcSlot === slot) && this.dstNode !== node)
			||
			// source to destination, and dest is slot and source isn't slot
			(!rtl && !slot.is_connected && (!this.dstSlot || this.dstSlot === slot) && this.srcNode !== node)

	var can = a && b && c

	if (can) {
		this._lastMatch = [node, slot]
	} else {
		this._lastMatch = []
	}

	return can
}

EditConnection.prototype.commit = function() {
	if (this.rightToLeft) {
		this.srcNode = this._lastMatch[0]
		this.srcSlot = this._lastMatch[1]
	} else {
		this.dstNode = this._lastMatch[0]
		this.dstSlot = this._lastMatch[1]
	}
}

if (typeof(module) !== 'undefined')
	module.exports = EditConnection
