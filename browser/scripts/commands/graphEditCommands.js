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
	var sid, connection, slotIndex = 0
	var node = this.node
	var graph = this.graph

	if (node.plugin.isGraph) {
		this.nodeInfo = {
			order: [ // restore in same render order
				graph.nodes.indexOf(node),
				graph.children.indexOf(node)
			]
		}
	} else if (node.parent_graph && node.parent_graph.plugin) {
		if (node.plugin.id === 'input_proxy') {
			sid = node.parent_graph.plugin.state.input_sids[node.uid]

			if (node.parent_graph.plugin.node.inputs.length) {
				connection = node.parent_graph.plugin.node.inputs.filter(function(input) {
					return input.dst_slot.uid === sid
				})[0]

				if (connection)
					slotIndex = connection.dst_slot.index
			}
		} else if (node.plugin.id === 'output_proxy') {
			sid = node.parent_graph.plugin.state.output_sids[node.uid]

			if (node.parent_graph.plugin.node.outputs.length) {
				connection = node.parent_graph.plugin.node.outputs.filter(function(output) {
					return output.src_slot.uid === sid
				})[0]

				if (connection)
					slotIndex = connection.src_slot.index
			}
		}

		if (sid !== undefined) {
			console.log('RemoveNode', sid, slotIndex, !!connection)
			this.nodeInfo = {
				proxy: {
					sid: sid,
					index: slotIndex,
					connection: connection ? connection.serialise() : null
				}
			}
		}
	}

	E2.app.dispatcher.dispatch({
		actionType: 'uiNodeRemoved',
		graph: this.graph, 
		node: this.node,
		info: this.nodeInfo
	})
}

function addNode() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodeAdded',
		graph: this.graph,
		node: this.node,
		info: this.nodeInfo
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
