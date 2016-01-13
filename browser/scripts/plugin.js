function Plugin(core, node) {
	var that = this
	this.core = core
	this.node = node

	this.state = {}

	this.node.on('pluginStateChanged', function() {
		if (that.state_changed && that.node.ui && that.node.ui.pluginUI)
			that.state_changed(that.node.ui.pluginUI)
	})
}

Plugin.prototype.undoableSetState = function(key, newValue, oldValue) {
	E2.app.undoManager.execute(
		new E2.commands.graph.ChangePluginState(
			this.node.parent_graph,
			this.node,
			key,
			oldValue,
			newValue
	))
}

Plugin.prototype.transientSetState = function(key, newValue) {
	E2.app.dispatcher.dispatch({
		actionType: 'uiPluginTransientStateChanged',
		graphUid: this.node.parent_graph.uid,
		nodeUid: this.node.uid,
		key: key,
		value: newValue
	})
}

Plugin.prototype.reset = function() {
	var that = this
	this.inputValues = {}
	this.input_slots.map(function(slot) {
		var def = slot.def !== undefined ? slot.def : that.core.get_default_value(slot.dt)
		that.inputValues[slot.name] = def
	})
}

Plugin.prototype.update_input = function(slot, data) {
	this.inputValues[slot.name] = data
}


if (typeof(module) !== 'undefined')
	module.exports = Plugin
