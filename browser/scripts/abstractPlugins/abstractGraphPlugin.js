(function() {
var AbstractGraphPlugin = function(core) {
	SubGraphPlugin.apply(this, arguments)

	this.desc = 'Encapsulate a nested graph into- and out of which arbitrary data can be routed and the encapsulated logic. Add input / output proxies inside the graph to feed data in / out of the graph.'
	
	this.input_slots = []
	this.output_slots = []
	
	this.state = {
		always_update:  true,
		input_sids:     {},
		output_sids:    {}
	}
}

AbstractGraphPlugin.prototype = Object.create(SubGraphPlugin.prototype)
AbstractGraphPlugin.prototype.constructor = AbstractGraphPlugin

AbstractGraphPlugin.prototype.getInspectorProperties = function() {
	return {
		always_update : {
			dt : E2.dt.BOOL,
			label : 'Always update'
		}
	}
}

AbstractGraphPlugin.prototype.isEntityPatch = function() {
	if (this.id === 'entity')
		return true

	if (this.node.dyn_outputs.length === 1)
		return this.node.dyn_outputs[0].dt.id === E2.dt.OBJECT3D.id

	return false
}

AbstractGraphPlugin.prototype.drilldown = function() {
	return NodeUI.drilldown(this);
}

AbstractGraphPlugin.prototype.update_input = function(slot, data) {
	if (slot.uid === undefined) {
		console.log('graph.plugin undefined uid')
	} else {
		this.input_nodes[slot.uid].plugin.input_updated(data)
	}
}

AbstractGraphPlugin.prototype.update_state = function(updateContext) {
	this.updated = false
	this.updated_sids.length = 0

	if (this.graph) {
		if(this.graph.update(updateContext) && this.graph === E2.app.player.core.active_graph)
			E2.app.updateCanvas(false)
	}
}

AbstractGraphPlugin.prototype.state_changed = function(ui) {
	var core = this.core
	var node = this.parent_node
	var self = this
	
	// Only rebuild the node lists during post-load patch up of the graph, 
	// during which 'ui' will be null. Otherwise the lists would have been rebuilt 
	// every time we switch to the graph containing this node in the editor.
	if (ui) {
		// Decorate the auto generated dom base element with an
		// additional class to allow custom styling.
		node.ui.dom.addClass('graph')
		return
	}
	
	this.setupProxies()
}

window.AbstractGraphPlugin = AbstractGraphPlugin

if (typeof(module) !== 'undefined')
	module.exports = AbstractGraphPlugin

})()
