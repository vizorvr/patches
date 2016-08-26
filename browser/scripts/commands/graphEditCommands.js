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
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		info: this.nodeInfo
	})
}

// -------------------------------------

function addNode() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodeAdded',
		graphUid: this.graph.uid,
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
	this.title = 'Remove node ' + this.node.title
}
RemoveNode.prototype = Object.create(GraphEditCommand.prototype)
RemoveNode.prototype.undo = addNode
RemoveNode.prototype.redo = removeNode

// -------------------------------

function uiSlotRemoved() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiSlotRemoved',
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		slotUid: this.slot.uid
	})
}
function uiSlotAdded() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiSlotAdded',
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		slot: this.slot
	})
}
function AddSlot(graph, node, slot) {
	GraphEditCommand.apply(this, arguments)
	this.node = node
	this.slot = slot
}
AddSlot.prototype = Object.create(GraphEditCommand.prototype)
AddSlot.prototype.undo = uiSlotRemoved
AddSlot.prototype.redo = uiSlotAdded

function RemoveSlot(graph, node, slotUid) {
	GraphEditCommand.apply(this, arguments)
	this.node = node
	this.slot = node.findSlotByUid(slotUid)
}
RemoveSlot.prototype = Object.create(GraphEditCommand.prototype)
RemoveSlot.prototype.undo = uiSlotAdded
RemoveSlot.prototype.redo = uiSlotRemoved

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
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		title: this.origNodeTitle
	})
}

RenameNode.prototype.redo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodeRenamed',
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		title: this.newNodeTitle
	})
}


// -------------------------------

function uiDisconnected() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiDisconnected',
		graphUid: this.graph.uid,
		connectionUid: this.connection.uid
	})
}

function uiConnected() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiConnected',
		graphUid: this.graph.uid,
		connection: this.connection
	})
}

function Connect(graph, connection) {
	GraphEditCommand.apply(this, arguments)
	this.title = 'Connect'
	this.connection = connection
}

Connect.prototype = Object.create(GraphEditCommand.prototype)
Connect.prototype.undo = uiDisconnected
Connect.prototype.redo = uiConnected

// -------------------------------

function Disconnect(graph, connection) {
	GraphEditCommand.apply(this, arguments)
	this.title = 'Disconnect'
	this.connection = connection
}
Disconnect.prototype = Object.create(GraphEditCommand.prototype)
Disconnect.prototype.undo = uiConnected
Disconnect.prototype.redo = uiDisconnected

// -------------------------------

function Move(graph, nodes, dx, dy) {
	GraphEditCommand.apply(this, arguments)
	this.title = 'Move'
	this.nodes = nodes
	this.delta = { x: dx, y: dy }
}
Move.prototype = Object.create(GraphEditCommand.prototype)

Move.prototype.undo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodesMoved',
		graphUid: this.graph.uid,
		nodeUids: this.nodes.map(function(n) {
			return n.uid
		}),
		delta: {
			x: this.delta.x * -1,
			y: this.delta.y * -1
		}
	})
}

Move.prototype.redo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiNodesMoved',
		graphUid: this.graph.uid,
		nodeUids: this.nodes.map(function(n) {
			return n.uid
		}),
		delta: this.delta
	})
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
	this.title = title || 'Value Change to '+newValue+' from '+oldValue
	this.node = node
	this.key = key

	this.oldValue = oldValue
	this.newValue = newValue
}
ChangePluginState.prototype = Object.create(GraphEditCommand.prototype)

ChangePluginState.prototype.undo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiPluginStateChanged',
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		key: this.key,
		value: this.oldValue
	})
}

ChangePluginState.prototype.redo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiPluginStateChanged',
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		key: this.key,
		value: this.newValue
	})
}

// -------------------------------

function ChangeInputSlotValue(graph, node, slotName, newValue, oldValue) {
	GraphEditCommand.apply(this, arguments)
	this.node = node
	this.slotName = slotName
	this.oldValue = typeof oldValue !== 'undefined' ? oldValue : node.getInputSlotValue(slotName)
	this.newValue = newValue
	this.title = 'Slot Value Changed'
}
ChangeInputSlotValue.prototype = Object.create(GraphEditCommand.prototype)

ChangeInputSlotValue.prototype.undo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiSlotValueChanged',
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		slotName: this.slotName,
		value: this.oldValue
	})
}

ChangeInputSlotValue.prototype.redo = function() {
	E2.app.dispatcher.dispatch({
		actionType: 'uiSlotValueChanged',
		graphUid: this.graph.uid,
		nodeUid: this.node.uid,
		slotName: this.slotName,
		value: this.newValue
	})
}

// -------------------------------

function Undoable(graph, node, key, oldValue, newValue, title) {
	GraphEditCommand.apply(this, arguments)
	this.node = node
	this.key = key
	this.title = title || 'Value Change'
	this.oldValue = oldValue
	this.newValue = newValue
	this.setterFn = setterFn
}

Undoable.prototype = Object.create(GraphEditCommand.prototype)

Undoable.prototype.undo = function() {
	E2.app.dispatcher.dispatch('pluginStateChanged', 
		this.graph,
		this.node,
		this.key,
		this.oldValue
	)

	this.setterFn(this.oldValue)
}

Undoable.prototype.redo = function() {
	E2.app.dispatcher.dispatch('pluginStateChanged', 
		this.graph,
		this.node,
		this.key,
		this.newValue
	)

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
	E2.commands.graph.AddSlot = AddSlot
	E2.commands.graph.RemoveSlot = RemoveSlot
	E2.commands.graph.RenameNode = RenameNode
	E2.commands.graph.Connect = Connect
	E2.commands.graph.Disconnect = Disconnect
	E2.commands.graph.Move = Move
	E2.commands.graph.Reorder = Reorder

	E2.commands.graph.ChangePluginState = ChangePluginState
	E2.commands.graph.ChangeInputSlotValue = ChangeInputSlotValue
}

if (typeof(module) !== 'undefined') {
	module.exports = E2.commands.graph
}

})()
