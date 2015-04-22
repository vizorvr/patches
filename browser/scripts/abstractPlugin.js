function AbstractPlugin() {}

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

