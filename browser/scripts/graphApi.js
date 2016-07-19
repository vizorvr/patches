if (typeof(require) === 'function')
	require('./commands/graphEditCommands')

function GraphApi(undoManager) {
	this.undoManager = undoManager
}

/**
 * adds the patchNode to the parent of targetNode,
 * and connect the patchNode to the targetNode.
 * the inputs and outputs must have the same names.
 * used eg. when a component is dropped on an entity
 */
GraphApi.prototype.autoConnectPatchToNode = function(patchNode, targetNode) {
	var that = this
	var parentPatch = targetNode.parent_graph

	patchNode
	.getDynamicOutputSlots()
	.map(function(output) {
		var connection = Connection.hydrate(parentPatch, {
			src_nuid: patchNode.uid,
			dst_nuid: targetNode.uid,
			src_slot: output.index,
			src_dyn: true,
			dst_slot: output.name,
			dst_dyn: false
		})

		// figure out how to mix values on busy slots
		// instead of replacing the connections

		that.connect(parentPatch, connection)
		E2.app.onLocalConnectionChanged(connection)
	})
}


GraphApi.prototype.addNode = function(graph, node) {
	var cmd = new E2.commands.graph.AddNode(graph, node)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.removeNode = function(graph, node) {
	var cmd = new E2.commands.graph.RemoveNode(graph, node)
	return this.undoManager.execute(cmd)
}

GraphApi.prototype.addSlot = function(graph, node, slot) {
	return this.undoManager.execute(new E2.commands.graph.AddSlot(graph, node, slot))
}

GraphApi.prototype.removeSlot = function(graph, node, slotUid) {
	return this.undoManager.execute(new E2.commands.graph.RemoveSlot(graph, node, slotUid))
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

GraphApi.prototype.changeInputSlotValue = function(graph, node, slotName, newValue, oldValue) {
	var slot = node.findInputSlotByName(slotName)
	if (slot.is_connected)
		return;
	var cmd = new E2.commands.graph.ChangeInputSlotValue(graph, node, slotName, newValue, oldValue)
	return this.undoManager.execute(cmd)
}

if (typeof(module) !== 'undefined')
	module.exports = GraphApi
