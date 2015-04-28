if (typeof(require) === 'function')
	require('./commands/graphEditCommands')

function GraphApi(undoManager) {
	this.undoManager = undoManager
}

GraphApi.prototype.addNode = function(graph, node) {
	var cmd = new E2.commands.graph.AddNode(graph, node)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.removeNode = function(graph, node) {
	var cmd = new E2.commands.graph.RemoveNode(graph, node)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.renameNode = function(graph, node, title) {
	var cmd = new E2.commands.graph.RenameNode(graph, node, title)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.connect = function(graph, connection) {
	var cmd = new E2.commands.graph.Connect(graph, connection)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.disconnect = function(graph, connection) {
	var cmd = new E2.commands.graph.Disconnect(graph, connection)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.move = function(graph, nodes, dx, dy) {
	var cmd = new E2.commands.graph.Move(graph, nodes, dx, dy)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.reorder = function(graph, original, sibling, insertAfter) {
	var cmd = new E2.commands.graph.Reorder(graph, original, sibling, insertAfter)
	return this.undoManager.execute(cmd)
}

if (typeof(module) !== 'undefined')
	module.exports = GraphApi
