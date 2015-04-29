(function() {

function GraphEditCommand(graph) {
	if (!(graph instanceof Graph))
		throw new Error('GraphEditCommand requires graph')
	this.graph = graph
}

GraphEditCommand.prototype.execute = function() {
	return this.redo()
}

// -------------------------------

function removeNode() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodeRemoved',
		graph: this.graph, 
		node: this.node
	})
}

function addNode() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodeAdded',
		graph: this.graph,
		node: this.node,
		order: this.order
	})
}

function AddNode(graph, node) {
	GraphEditCommand.apply(this, arguments)
	this.node = node
	this.title = 'Add node ' + node.title
}
AddNode.prototype = Object.create(GraphEditCommand.prototype)
AddNode.prototype.undo = removeNode
AddNode.prototype.redo = addNode

// -------------------------------

function RemoveNode(graph, node) {
	GraphEditCommand.apply(this, arguments)
	this.node = node
	this.title = 'Remove node ' + node.title

	if (node.plugin.isGraph) {
		this.order = [
			graph.nodes.indexOf(node),
			graph.children.indexOf(node)
		]
	}
}
RemoveNode.prototype = Object.create(GraphEditCommand.prototype)
RemoveNode.prototype.undo = addNode
RemoveNode.prototype.redo = removeNode

// -------------------------------

function RenameNode(graph, node, title) {
	GraphEditCommand.apply(this, arguments)
	this.node = node
	this.origNodeTitle = node.title
	this.newNodeTitle = title
	this.title = 'Rename node ' + node.title + ' to ' + title
}
RenameNode.prototype = Object.create(GraphEditCommand.prototype)
RenameNode.prototype.undo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodeRenamed',
		graph: this.graph,
		node: this.node,
		title: this.origNodeTitle
	})
}

RenameNode.prototype.redo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodeRenamed',
		graph: this.graph,
		node: this.node,
		title: this.newNodeTitle
	})
}


// -------------------------------

function Connect(graph, connection) {
	GraphEditCommand.apply(this, arguments)
	this.title = 'Connect'
	this.connection = connection
}
Connect.prototype = Object.create(GraphEditCommand.prototype)

Connect.prototype.undo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiDisconnected',
		graph: this.graph,
		connection: this.connection
	})
}

Connect.prototype.redo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiConnected',
		graph: this.graph,
		connection: this.connection
	})
}

// -------------------------------

function Disconnect(graph, connection) {
	GraphEditCommand.apply(this, arguments)
	this.title = 'Disconnect'
	this.connection = connection
}
Disconnect.prototype = Object.create(GraphEditCommand.prototype)

Disconnect.prototype.undo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiConnected',
		graph: this.graph,
		connection: this.connection
	})
/*
	this.connection = this.graph.connect(this.offset,
		this.connection.src_node, 
		this.connection.dst_node,
		this.connection.src_slot,
		this.connection.dst_slot)

	return this.connection
*/
}

Disconnect.prototype.redo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiDisconnected', 
		graph: this.graph,
		connection: this.connection
	})
}

// -------------------------------

function _gatherConnections(nodes) {
	return nodes.reduce(function(arr, node) {
		return arr.concat(node.inputs.concat(node.outputs))
	}, [])
}

function Move(graph, nodes, dx, dy) {
	GraphEditCommand.apply(this, arguments)
	this.title = 'Move'
	this.nodes = nodes
	this.delta = { x: dx, y: dy }
}
Move.prototype = Object.create(GraphEditCommand.prototype)

Move.prototype.undo = function() {
	var connections = _gatherConnections(this.nodes)
	E2.app.executeNodeDrag(this.nodes, connections, this.delta.x * -1, this.delta.y * -1)
}

Move.prototype.redo = function() {
	var connections = _gatherConnections(this.nodes)
	E2.app.executeNodeDrag(this.nodes, connections, this.delta.x, this.delta.y)
}

// -------------------------------

function Reorder(graph, original, sibling, insertAfter) {
	GraphEditCommand.apply(this, arguments)
	console.log('Reorder', arguments)
	this.title = 'Reorder'
	this.original = original
	this.sibling = sibling
	this.insertAfter = insertAfter
}
Reorder.prototype = Object.create(GraphEditCommand.prototype)

Reorder.prototype.undo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiGraphTreeReordered',
		graph: this.graph,
		original: this.sibling,
		sibling: this.original,
		insertAfter: this.insertAfter
	})
}

Reorder.prototype.redo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiGraphTreeReordered',
		graph: this.graph,
		original: this.original,
		sibling: this.sibling,
		insertAfter: this.insertAfter
	})
}

// -------------------------------

function ChangePluginState(graph, node, key, oldValue, newValue, title) {
	GraphEditCommand.apply(this, arguments)
	this.title = title || 'Value Change'
	this.node = node
	this.key = key

	this.oldValue = oldValue
	this.newValue = newValue
}
ChangePluginState.prototype = Object.create(GraphEditCommand.prototype)

ChangePluginState.prototype.undo = function() {
	this.node.plugin.state[this.key] = this.oldValue
	this.node.plugin.updated = true
	if (this.node.ui)
		this.node.plugin.state_changed(this.node.ui.plugin_ui)
}

ChangePluginState.prototype.redo = function() {
	this.node.plugin.state[this.key] = this.newValue
	this.node.plugin.updated = true
	if (this.node.ui)
		this.node.plugin.state_changed(this.node.ui.plugin_ui)
}

// -------------------------------

function Undoable(oldValue, newValue, setterFn, title) {
	this.title = title || 'Value Change'
	this.oldValue = oldValue
	this.newValue = newValue
	this.setterFn = setterFn
}

Undoable.prototype.undo = function() {
	this.setterFn(this.oldValue)
}

Undoable.prototype.redo = function() {
	this.setterFn(this.newValue)
}

// -------------------------------

if (typeof(E2) !== 'undefined') {
	if (!E2.commands)
		E2.commands = {}
	if (!E2.commands.graph)
		E2.commands.graph = {}

	E2.commands.Undoable = Undoable

	E2.commands.graph.AddNode = AddNode
	E2.commands.graph.RemoveNode = RemoveNode
	E2.commands.graph.RenameNode = RenameNode
	E2.commands.graph.Connect = Connect
	E2.commands.graph.Disconnect = Disconnect
	E2.commands.graph.Move = Move
	E2.commands.graph.Reorder = Reorder

	E2.commands.graph.ChangePluginState = ChangePluginState
}

if (typeof(module) !== 'undefined') {
	module.exports = E2.commands.graph
}

})()
