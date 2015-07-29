function Plugin(core, node) {
	var that = this
	this.core = core
	this.node = node

	this.node.on('pluginStateChanged', function() {
		if (that.state_changed && that.node.ui && that.node.ui.plugin_ui)
			that.state_changed(that.node.ui.plugin_ui)
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

if (typeof(module) !== 'undefined')
	module.exports = Plugin
