function SubGraphPlugin(core, node) {
	this.core = core
	this.node = node

	this.parent_node = node; // For reverse lookup in the core.
	this.updated_sids = []

	this.input_nodes = {}
	this.output_nodes = {}

	this.gl = core.renderer.context

	this.ui = null
	this.isGraph = true
}


SubGraphPlugin.prototype.reset = function() {
	if (this.graph)
		this.graph.reset()
}

SubGraphPlugin.prototype.play = function() {
	if (this.graph)
		this.graph.pause()
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

SubGraphPlugin.prototype.connection_changed = function(on, conn, slot) {
	if (slot.uid !== undefined) {
		var psl = null
		var core = this.core
		
		if (!on) {
			if (slot.type === E2.slot_type.input) {
				var inode = this.input_nodes[slot.uid]
				
				psl = inode.dyn_outputs[0]
				inode.plugin.data = core.get_default_value(slot.dt)
				inode.reset()
			} else {
				var node = this.parent_node
				var count = 0
				
				for(var i = 0, len = node.outputs.length; i < len; i++) {
					if(node.outputs[i].src_slot === slot)
						count++
				}
				
				if (count === 0)
					psl = this.output_nodes[slot.uid].dyn_inputs[0]
			}

			if (psl && !psl.connected) {
				psl.dt = slot.dt = core.datatypes.ANY
				this.dbg('Resetting PDT/GDT for slot(' + slot.uid + ')')
			}
		} else {
			var tn = null
			
			if (slot.type === E2.slot_type.input) {
				if (slot.dt === core.datatypes.ANY) {
					slot.dt = conn.src_slot.dt
					this.dbg('Setting GDT for slot(' + slot.uid + ') to ' + this.get_dt_name(conn.src_slot.dt))
				}
				
				tn = this.input_nodes[slot.uid]
				if (!tn)
					return;
				psl = tn.dyn_outputs[0]
			} else {
				if (slot.dt === core.datatypes.ANY) {
					slot.dt = conn.dst_slot.dt
					this.dbg('Setting GDT for slot(' + slot.uid + ') to ' + this.get_dt_name(conn.dst_slot.dt))
				}
				
				tn = this.output_nodes[slot.uid]
				if (!tn)
					return;
				psl = tn.dyn_inputs[0]
			}
			
			if (psl.dt === core.datatypes.ANY) {
				this.dbg('Setting PDT for slot(' + psl.uid + ') to ' + this.get_dt_name(slot.dt))
				psl.dt = slot.dt
				tn.plugin.data = core.get_default_value(slot.dt)
			}
		}
	} else if(slot.type === E2.slot_type.output) {
		this.set_render_target_state(on)
	}
}

SubGraphPlugin.prototype.proxy_connection_changed = function(on, p_node, t_node, slot, t_slot) {
	var that = this
	var core = this.core
	var node = this.parent_node
	
	function find_sid(nodes, uid) {
		for (var n in nodes) {
			console.log('find_sid', n, nodes[n].uid, uid)
			if(nodes[n].uid === uid)
				return parseInt(n)
		}
		
		msg('ERROR: Failed to resolve node(' + uid + ') in graph(' + that.graph.plugin.parent_node.title + ').')
		return -1;
	}
	
	function is_gslot_connected(gslot) {
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
	
	function change_slots(last, g_slot, p_slot) {
		// that.dbg('Proxy slot change ' + on + ', last = ' + last + ', g_slot = ' + g_slot.uid + ', p_slot = ' + p_slot.uid)
		
		p_slot.connected = true
		
		if (on) {
			if (p_slot.dt === core.datatypes.ANY) {
				p_slot.dt = t_slot.dt		
				that.dbg('    Setting PDT to ' + that.get_dt_name(t_slot.dt) + '.')
			
				if (g_slot.dt === core.datatypes.ANY) {
					p_node.plugin.data = core.get_default_value(t_slot.dt)
				}
			}

			if (g_slot.dt === core.datatypes.ANY) {
				g_slot.dt = t_slot.dt		
				that.dbg('    Setting GDT to ' + that.get_dt_name(t_slot.dt) + '.')
			}
		} else if (last) {
			var conns = node.parent_graph.connections
			var connected = false
			var i, len
			var rgsl

			for(i = 0, len = conns.length; i < len; i++) {
				var c = conns[i]
				
				if(c.dst_slot === g_slot || c.src_slot === g_slot) {
					connected = true
					break;
				}
			}
			
			p_slot.connected = false

			if (!connected) {
				p_slot.dt = g_slot.dt = core.datatypes.ANY
				that.dbg('    Reverting to PDT/GDT to ANY.')
			}


			if (t_node.plugin.id === 'input_proxy') {
				connected = false

				for(i = 0, len = t_node.outputs.length; i < len; i++) {
					if(t_node.outputs[i].src_slot === t_slot) {
						connected = true
						break;
					}
				}
				
				rgsl = node.find_dynamic_slot(E2.slot_type.input, find_sid(that.input_nodes, t_node.uid))
				
				if (!connected && !is_gslot_connected(rgsl)) {
					t_slot.dt = rgsl.dt = core.datatypes.ANY
					that.dbg('    Reverting remote proxy slot to PDT/GDT to ANY.')
				}
			} else if(t_node.plugin.id === 'output_proxy') {
				rgsl = node.find_dynamic_slot(E2.slot_type.output, find_sid(that.output_nodes, t_node.uid))
				
				if(!is_gslot_connected(rgsl)) {
					t_slot.dt = rgsl.dt = core.datatypes.ANY
					that.dbg('    Reverting remote proxy slot to PDT/GDT to ANY.')
				}
			}
		}
	}
	
	var last

	if (p_node.plugin.id === 'input_proxy') {
		last = p_node.outputs.length === 0
		change_slots(last, node.find_dynamic_slot(E2.slot_type.input, find_sid(this.input_nodes, p_node.uid)), slot)
		this.dbg('    Output count = ' + p_node.outputs.length)
	} else {
		last = p_node.inputs.length === 0
		
		change_slots(last, node.find_dynamic_slot(E2.slot_type.output, find_sid(this.output_nodes, p_node.uid)), slot)
		this.dbg('    Input count = ' + p_node.inputs.length)
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

