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

function addNode() {
	var node = this.graph.addNode(this.node)
	node.inputs.concat(node.outputs).map(function(conn) {
		// as a side-effect of adding a node eg. from an undo
		// all its existing connections are re-added
		this.graph.addConnection(conn)
	}.bind(this))
	return node
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

function removeNode() {
	var node = this.node
	node.inputs.concat(node.outputs).map(function(conn) {
		// as a side-effect of removing a node, all its connections
		// get removed
		this.graph.disconnect(conn)
	}.bind(this))
	return this.graph.removeNode(this.node)
}

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
	this.graph.renameNode(this.node, this.origNodeTitle)
}

RenameNode.prototype.redo = function() {
	this.graph.renameNode(this.node, this.newNodeTitle)
}


// -------------------------------

function Connect(graph, srcNode, dstNode, srcSlot, dstSlot, offset) {
	GraphEditCommand.apply(this, arguments)
	this.title = 'Connect'
	this.srcNode = srcNode
	this.dstNode = dstNode
	this.srcSlot = srcSlot
	this.dstSlot = dstSlot
	this.offset = offset
}
Connect.prototype = Object.create(GraphEditCommand.prototype)

Connect.prototype.undo = function() {
	return this.graph.disconnect(this.connection)
}

Connect.prototype.redo = function() {
	this.connection = this.graph.connect(this.offset,
		this.srcNode, this.dstNode, this.srcSlot, this.dstSlot)

	return this.connection
}

// -------------------------------

function Disconnect(graph, connection) {
	GraphEditCommand.apply(this, arguments)
	this.title = 'Disconnect'
	this.connection = connection
}
Disconnect.prototype = Object.create(GraphEditCommand.prototype)

Disconnect.prototype.undo = function() {
	this.connection = this.graph.connect(this.offset,
		this.connection.src_node, 
		this.connection.dst_node,
		this.connection.src_slot,
		this.connection.dst_slot)

	return this.connection
}

Disconnect.prototype.redo = function() {
	return this.graph.disconnect(this.connection)
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

if (typeof(E2) !== 'undefined') {
	if (!E2.commands)
		E2.commands = {}
	if (!E2.commands.graph)
		E2.commands.graph = {}

	E2.commands.graph.AddNode = AddNode
	E2.commands.graph.RemoveNode = RemoveNode
	E2.commands.graph.RenameNode = RenameNode
	E2.commands.graph.Connect = Connect
	E2.commands.graph.Disconnect = Disconnect
	E2.commands.graph.Move = Move
}

if (typeof(module) !== 'undefined') {
	module.exports = E2.commands.graph
}

})()

