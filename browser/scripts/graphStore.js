(function() {

function mapConnections(node, fn) {
	node.inputs.concat(node.outputs).map(fn)
}

function GraphStore() {
	Store.apply(this, arguments)
	this._setupListeners()
	this.storeName = 'graph'
}

GraphStore.prototype = Object.create(Store.prototype)

GraphStore.prototype._setupListeners = function() {
	E2.app.dispatcher.register(function receiveFromDispatcher(payload) {
		if (payload.graphUid === undefined)
			return;

		var graph = Graph.lookup(payload.graphUid)
		if (!graph)
			return console.error('No graph found for payload guid ', payload.graphUid)

		switch(payload.actionType) {
			case 'uiGraphTreeReordered':
				this._uiGraphTreeReordered(
					graph,
					payload.original,
					payload.sibling,
					payload.insertAfter)
				break;
			case 'uiNodeOpenStateChanged':
				var node = graph.findNodeByUid(payload.nodeUid)
				node.setOpenState(payload.isOpen)
				break;
			case 'uiNodeAdded':
				this._uiNodeAdded(graph, payload.node, payload.info)
				break;
			case 'uiNodeRemoved':
				this._uiNodeRemoved(graph, payload.nodeUid)
				break;
			case 'uiSlotAdded':
				this._uiSlotAdded(graph, payload.nodeUid, payload.slot)
				break;
			case 'uiSlotRemoved':
				this._uiSlotRemoved(graph, payload.nodeUid, payload.slotUid)
				break;
			case 'uiNodeRenamed':
				this._uiNodeRenamed(graph, payload.nodeUid, payload.title)
				break;
			case 'uiConnected':
				this._uiConnected(graph, payload.connection)
				break;
			case 'uiDisconnected':
				this._uiDisconnected(graph, payload.connectionUid)
				break;
			case 'uiNodesMoved':
				this._uiNodesMoved(graph, payload.nodeUids, payload.delta)
				break;
			case 'uiPluginStateChanged':
				this._uiPluginStateChanged(
					graph,
					payload.nodeUid,
					payload.key,
					payload.value)
				break;
		}
	}.bind(this))
}

GraphStore.prototype._uiGraphTreeReordered = function(graph, original, sibling, insertAfter) {
	graph.reorder_children(original, sibling, insertAfter)
	this.emit('reordered', graph)
	this.emit('changed')
}

GraphStore.prototype._uiNodeAdded = function(graph, node, info) {
	graph.addNode(node, info)

	node.reset()
	node.initialise()

	mapConnections(node, function(conn) {
		graph.connect(conn)
	})

	this.emit('nodeAdded', graph, node, info)

	if (info && info.proxy && info.proxy.connection) {
		this._uiConnected(graph.parent_graph, info.proxy.connection)
	}

	this.emit('changed')
}

GraphStore.prototype._uiNodeRemoved = function(graph, nodeUid) {
	var node = graph.findNodeByUid(nodeUid)
	if (!node) {
		console.warn('_uiNodeRemoved: node not found in graph', graph.uid)
		return;
	}
	mapConnections(node, graph.disconnect.bind(graph))
	graph.removeNode(node)
	this.emit('nodeRemoved', graph, node)
	this.emit('changed')
}

GraphStore.prototype._uiNodeRenamed = function(graph, nodeUid, title) {
	var node = graph.findNodeByUid(nodeUid)
	graph.renameNode(node, title)
	this.emit('nodeRenamed', graph, node)
	this.emit('changed')
}

GraphStore.prototype._uiSlotAdded = function(graph, nodeUid, slot) {
	var node = graph.findNodeByUid(nodeUid)
	node.add_slot(slot.type, slot)

	if (node.plugin.lsg)
		node.plugin.lsg.add_dyn_slot(node.findSlotByUid(slot.uid))

	this.emit('slotAdded', graph, node, slot)
	this.emit('changed')
}

GraphStore.prototype._uiSlotRemoved = function(graph, nodeUid, slotUid) {
	var node = graph.findNodeByUid(nodeUid)
	var slot = node.findSlotByUid(slotUid)

	node.remove_slot(slot.type, slot.uid)

	if (node.plugin.lsg)
		node.plugin.lsg.remove_dyn_slot(slot)

	this.emit('slotAdded', graph, node, slot)
	this.emit('changed')
}

GraphStore.prototype._uiConnected = function(graph, connection) {
	graph.connect(connection)
	this.emit('connected', graph, connection)
	this.emit('changed')
}

GraphStore.prototype._uiDisconnected = function(graph, connectionUid) {
	var connection = graph.findConnectionByUid(connectionUid)
	if (!connection) {
		msg('WARN: GraphStore._uiDisconnected: could not find connectionUid '+connectionUid)
		return;
	}

	graph.disconnect(connection)

	this.emit('disconnected', graph, connection)
	this.emit('changed')
}

function _gatherConnections(nodes) {
	return nodes.reduce(function(arr, node) {
		return arr.concat(node.inputs.concat(node.outputs))
	}, [])
}

GraphStore.prototype._uiNodesMoved = function(graph, nodeUids, delta) {
	var nodes = nodeUids.map(function(nid) {
		return graph.findNodeByUid(nid)
	})
	var connections = _gatherConnections(nodes)
	E2.app.executeNodeDrag(nodes,
		connections,
		delta.x,
		delta.y)
}

GraphStore.prototype._uiPluginStateChanged = function(graph, nodeUid, key, value) {
	var node = graph.findNodeByUid(nodeUid)

	node.plugin.state[key] = value
	node.plugin.updated = true

	if (node.plugin.state_changed) {
		node.plugin.state_changed()

		if (node.ui)
			node.plugin.state_changed(node.ui.plugin_ui)
	}
}

if (typeof(module) !== 'undefined')
	module.exports = GraphStore
else
	window.GraphStore = GraphStore

})()

