/*
	- "input node" refers to input proxy
	- input_nodes is a map of graph node slot uid -> input proxy node
		inside the graph

 */
function SubGraphPlugin(core, node) {
	this.core = core
	this.node = node

	this.parent_node = node; // For reverse lookup in the core.
	this.updated_sids = []

	this.input_nodes = {}
	this.output_nodes = {}

	this.ui = null
	this.isGraph = true
}


SubGraphPlugin.prototype.reset = function() {
	if (this.graph)
		this.graph.reset()
}

SubGraphPlugin.prototype.play = function() {
	if (this.graph)
		this.graph.play()
}

SubGraphPlugin.prototype.pause = function() {
	if (this.graph)
		this.graph.pause()
}

SubGraphPlugin.prototype.stop = function() {
	if (this.graph)
		this.graph.stop()
}

SubGraphPlugin.prototype.get_dt_name = function(dt) {
	if (!dt || !dt.name)
		return 'ERROR'

	return dt.name
}

SubGraphPlugin.prototype.dbg = function(str) {
	msg('Graph: ' + str)
}

// when an external proxy slot is disconnected, clear the datatype of the proxy
SubGraphPlugin.prototype.onProxySlotDisconnected = function(conn, slot) {
	var internalSlot

	if (slot.type === E2.slot_type.input) {
		// inbound connection to external slot for input_proxy was disconnected
		var inputProxyNode = this.input_nodes[slot.uid] 
		if (!inputProxyNode)
			return;
		internalSlot = inputProxyNode.dyn_outputs[0] // output slot of input proxy
		inputProxyNode.plugin.data = this.core.get_default_value(slot.dt)
		inputProxyNode.reset()
	} else {
		// outbound connection from external slot of output_proxy was disconnected
		var node = this.parent_node
		var count = 0 // connection count from external output slot
		for(var i = 0, len = node.outputs.length; i < len; i++) {
			if (node.outputs[i].src_slot === slot)
				count++
		}
		
		if (count === 0) 
			internalSlot = this.output_nodes[slot.uid].dyn_inputs[0] // input slot of output proxy
	}

	if (internalSlot && !internalSlot.connected) {
		// reset the external slot to ANY because it was disconnected
		internalSlot.dt = slot.dt = this.core.datatypes.ANY
	}

}

SubGraphPlugin.prototype.connection_changed = function(on, conn, externalSlot) {
	var internalSlot = null
	var core = this.core

	if (!on) {
		// something was disconnected from an external slot
		this.onProxySlotDisconnected(conn, externalSlot)
	} else {
		// something was connected to an external slot
		var proxyNode = null
		
		if (externalSlot.type === E2.slot_type.input) {
			// external input slot was connected
			// assume the datatype and arrayness if not already set
			if (externalSlot.dt.id === E2.dt.ANY.id) {
				externalSlot.dt = conn.src_slot.dt
				externalSlot.array = conn.src_slot.array
			}

			proxyNode = this.input_nodes[externalSlot.uid]
			if (!proxyNode)
				return;
			internalSlot = proxyNode.dyn_outputs[0]
		} else {
			// external output slot was connected
			// assume the datatype and arrayness if not already set
			if (externalSlot.dt.id === E2.dt.ANY.id) {
				externalSlot.dt = conn.dst_slot.dt
				externalSlot.array = conn.dst_slot.array
			}

			proxyNode = this.output_nodes[externalSlot.uid]
			if (!proxyNode)
				return;
			internalSlot = proxyNode.dyn_inputs[0]
		}
		
		if (internalSlot.dt.id === E2.dt.ANY.id) {
			internalSlot.dt = externalSlot.dt
			internalSlot.array = externalSlot.array
		}

		proxyNode.plugin.data = core.get_default_value(externalSlot.dt)
	}
}

// p_node = proxy
// t_node = connection source node
// slot = proxy slot
// t_slot = connection source slot
SubGraphPlugin.prototype.proxy_connection_changed = function(on, proxyNode, otherNode, proxySlot, otherSlot) {
	var that = this
	var core = this.core
	var node = this.parent_node

	function find_sid(nodes, uid) {
		for (var n in nodes) {
			if(nodes[n].uid === uid)
				return n
		}
		
		msg('ERROR: Failed to resolve node(' + uid + ') in graph(' + that.graph.plugin.parent_node.title + ').')
		return -1;
	}
	
	function isExternalSlotConnected(gslot) {
		var i, len
		if (gslot.type === E2.slot_type.input) {
			for(i = 0, len = node.inputs.length; i < len; i++) {
				if(node.inputs[i].dst_slot === gslot)
					return true;
			}
		} else {
			for(i = 0, len = node.outputs.length; i < len; i++) {
				if(node.outputs[i].src_slot === gslot)
					return true;
			} 
		}
		
		return false
	}
	
	function changeSlots(lastRemoved, externalSlot) {
		proxySlot.connected = true
		
		if (on) {
			// something connected to the proxy
			// assume the dt and arrayness of the other end 
			proxySlot.dt = otherSlot.dt
			proxySlot.array = otherSlot.array
			proxyNode.plugin.data = core.get_default_value(otherSlot.dt)
			externalSlot.dt = otherSlot.dt
			externalSlot.array = otherSlot.dt
		} else if (lastRemoved) {
			// last connection was removed from proxy
			var parentGraphConnections = node.parent_graph.connections
			var connected = false
			var i, len
			var remoteProxySlot

			// is the external slot connected?
			for(i = 0, len = parentGraphConnections.length; i < len; i++) {
				var c = parentGraphConnections[i]
				
				if (c.dst_slot === externalSlot || c.src_slot === externalSlot) {
					connected = true
					break;
				}
			}
			
			proxySlot.connected = false

			if (!connected) {
				proxySlot.dt = externalSlot.dt = core.datatypes.ANY
			}

			if (otherNode.plugin.id === 'input_proxy') {
				connected = false

				for(i = 0, len = otherNode.outputs.length; i < len; i++) {
					if (otherNode.outputs[i].src_slot === otherSlot) {
						connected = true
						break;
					}
				}
				
				remoteProxySlot = node.find_dynamic_slot(E2.slot_type.input, 
					find_sid(that.input_nodes, otherNode.uid))
				
				if (!connected && !isExternalSlotConnected(remoteProxySlot)) {
					otherSlot.dt = remoteProxySlot.dt = core.datatypes.ANY
				}
			} else if (otherNode.plugin.id === 'output_proxy') {
				remoteProxySlot = node.find_dynamic_slot(E2.slot_type.output, 
					find_sid(that.output_nodes, otherNode.uid))
				
				if(!isExternalSlotConnected(rgsl)) {
					otherSlot.dt = remoteProxySlot.dt = core.datatypes.ANY
				}
			}
		}
	}
	
	var lastRemoved

	if (proxyNode.plugin.id === 'input_proxy') {
		lastRemoved = proxyNode.outputs.length === 0
		
		changeSlots(lastRemoved,
			node.find_dynamic_slot(
				E2.slot_type.input,
				find_sid(this.input_nodes, proxyNode.uid)
		))

		this.dbg('    Output count = ' + proxyNode.outputs.length)
	} else { // output proxy
		lastRemoved = proxyNode.inputs.length === 0
		
		changeSlots(lastRemoved,
			node.find_dynamic_slot(
				E2.slot_type.output,
				find_sid(this.output_nodes, proxyNode.uid)
		))

		this.dbg('    Input count = ' + proxyNode.inputs.length)
	}
}

SubGraphPlugin.prototype.update_output = function(slot) {
	if (slot.uid !== undefined)
		return this.output_nodes[slot.uid].plugin.data
		
	this.updated = true
	return this.texture
}

SubGraphPlugin.prototype.query_output = function(slot) {
	return (slot.uid === undefined) || this.updated_sids.indexOf(slot.uid) > -1
}

SubGraphPlugin.prototype.destroy_slot = function(type, nuid) {
	var slots = (type === E2.slot_type.input) ? this.state.input_sids : this.state.output_sids
	var sid = slots[nuid]
	
	delete slots[nuid]

	this.parent_node.remove_slot(type, sid)
}

SubGraphPlugin.prototype.setupProxies = function() {
	var that = this

	function find_node(uid) {
		var n = that.graph.findNodeByUid(uid)
		if (!n)
			return msg('ERROR: Failed to find registered proxy node(' + uid +
				') in graph(' + self.graph.plugin.parent_node.title + ').'); 

		var p = n.plugin
		
		p.data = E2.core.get_default_value((p.id === 'input_proxy' ?
			n.dyn_outputs : n.dyn_inputs)[0]
		.dt)

		return n
	}

	for(var uid in this.state.input_sids) {
		this.input_nodes[this.state.input_sids[uid]] = find_node(uid)
	}

	for(var uid in this.state.output_sids)
		this.output_nodes[this.state.output_sids[uid]] = find_node(uid)
}

SubGraphPlugin.prototype.setGraph = function(graph) {
	var that = this
	var node = this.parent_node
	
	this.graph = graph

	this.graph
	.on('nodeAdded', function(addedNode, info) {
		var sid
		var pid = addedNode.plugin.id
		var slotInfo = {
			name: addedNode.title,
			dt: E2.dt.ANY,
			index: info && info.proxy ? info.proxy.index : null,
			uid: info && info.proxy ? info.proxy.sid : null
		}

		if (pid === 'input_proxy') {
			sid = node.add_slot(E2.slot_type.input, slotInfo)
			that.state.input_sids[addedNode.uid] = sid
			that.input_nodes[sid] = addedNode
		} else if (pid === 'output_proxy') {
			sid = node.add_slot(E2.slot_type.output, slotInfo)
			that.state.output_sids[addedNode.uid] = sid
			that.output_nodes[sid] = addedNode
		}
	})
	.on('nodeRemoved', function(removedNode) {
		var pid = removedNode.plugin.id
		if (pid === 'input_proxy')
			that.destroy_slot(E2.slot_type.input, removedNode.uid)
		else if (pid === 'output_proxy')
			that.destroy_slot(E2.slot_type.output, removedNode.uid)
	})
	.on('nodeRenamed', function(renamedNode) {
		var pid = renamedNode.plugin.id
		if (pid === 'input_proxy')
			node.rename_slot(E2.slot_type.input, that.state.input_sids[renamedNode.uid], renamedNode.title)
		else if (pid === 'output_proxy')
			node.rename_slot(E2.slot_type.output, that.state.output_sids[renamedNode.uid], renamedNode.title)
	})
}

if (typeof(module) !== 'undefined')
	module.exports = SubGraphPlugin

