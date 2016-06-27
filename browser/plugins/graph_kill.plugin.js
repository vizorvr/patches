(function() {
var GraphKill = E2.plugins.graph_kill_emitter = function(core) {
	this.desc = ''

	this.input_slots = [{
		name: 'trigger', 
		dt: core.datatypes.BOOL, 
		desc: 'Kills the current graph instance (eg. from inside an Array Function or Spawner) on trigger.', 
		def: 0 
	}]
}

GraphKill.prototype.update_input = function(slot, data) {
	if (!slot.dynamic) {
		if (slot.name === 'trigger' && data === true)
			this.killGraphInstance()
	}
}

GraphKill.prototype.killGraphInstance = function() {
	this.node.parent_graph.destroy()
}

GraphKill.prototype.state_changed = function() {}

})()

