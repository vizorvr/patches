function AbstractPlugin(core, node) {
	this.core = core
	this.node = node
}

AbstractPlugin.prototype.undoableSetState = function(key, newValue, oldValue) {
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
	module.exports = AbstractPlugin