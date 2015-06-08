(function() {

function mapConnections(node, fn) {
	node.inputs.concat(node.outputs).map(fn)
}

function graphLookup(uid) {
	var graph 
	E2.core.graphs.some(function(g) {
		if (g.uid === uid) {
			graph = g
			return true
		}
	})
	return graph
}

function GraphStore() {
	Store.apply(this, arguments)
	this.setupListeners()
	this.storeName = 'graph'
}

GraphStore.prototype = Object.create(Store.prototype)

GraphStore.prototype.setupListeners = function() {
	E2.app.dispatcher.register(function receiveFromDispatcher(payload) {
		console.log('GraphStore.receiveFromDispatcher', payload.actionType)

		switch(payload.actionType) {
			case 'uiGraphTreeReordered':
				this.uiGraphTreeReordered(
					payload.graph,
					payload.original,
					payload.sibling,
					payload.insertAfter)
				break;
			case 'uiNodeAdded':
				this.uiNodeAdded(payload.graph, payload.node, payload.info)
				break;
			case 'uiNodeRemoved':
				this.uiNodeRemoved(payload.graph, payload.node, payload.info)
				break;
			case 'uiSlotAdded':
				this.uiSlotAdded(payload.graph, payload.node, payload.slot)
				break;
			case 'uiSlotRemoved':
				this.uiSlotRemoved(payload.graph, payload.node, payload.slotUid)
				break;
			case 'uiNodeRenamed':
				this.uiNodeRenamed(payload.graph, payload.node, payload.title)
				break;
			case 'uiConnected':
				this.uiConnected(payload.graph, payload.connection)
				break;
			case 'uiDisconnected':
				this.uiDisconnected(payload.graph, payload.connection)
				break;
		}
	}.bind(this))
}

GraphStore.prototype.uiGraphTreeReordered = function(graph, original, sibling, insertAfter) {
	graph.reorder_children(original, sibling, insertAfter)
	this.publish('reordered', graph)
	this.emit('changed')
}

GraphStore.prototype.uiNodeAdded = function(graph, node, info) {
	graph.addNode(node, info)

	mapConnections(node, function(conn) {
		graph.connect(conn)
	})

	this.publish('nodeAdded', graph, node, info)

	if (info && info.proxy && info.proxy.connection) {
		console.log('re-adding', info.proxy.connection)
		var connection = new Connection()
		connection.deserialise(info.proxy.connection)
		this.uiConnected(graph.parent_graph, connection)
	}

	this.emit('changed')
}

GraphStore.prototype.uiNodeRemoved = function(graph, node) {
	mapConnections(node, function(conn) {
		// removing a node, all its connections should be removed
		graph.disconnect(conn)
	})

	graph.removeNode(node)

	this.publish('nodeRemoved', graph, node)

	this.emit('changed')
}

GraphStore.prototype.uiSlotAdded = function(graph, node, slot) {
	node.add_slot(slot.type, slot)

	if (node.plugin.lsg)
		node.plugin.lsg.add_dyn_slot(node.findSlotByUid(slot.uid))

	this.emit('slotAdded', graph, node, slot)
	this.emit('changed')
}

GraphStore.prototype.uiSlotRemoved = function(graph, node, slotUid) {
	var slot = node.findSlotByUid(slotUid)

	node.remove_slot(slot.type, slot.uid)

	if (node.plugin.lsg)
		node.plugin.lsg.remove_dyn_slot(slot)

	this.emit('slotAdded', graph, node, slot)
	this.emit('changed')
}

GraphStore.prototype.uiNodeRenamed = function(graph, node, title) {
	graph.renameNode(node, title)
	this.publish('nodeRenamed', graph, node)
	this.emit('changed')
}

GraphStore.prototype.uiConnected = function(graph, connection) {
	graph.connect(connection)
	this.publish('connected', graph, connection)
	this.emit('changed')
}

GraphStore.prototype.uiDisconnected = function(graph, connection) {
	graph.disconnect(connection)
	this.publish('disconnected', graph, connection)
	this.emit('changed')
}

if (typeof(module) !== 'undefined')
	module.exports = GraphStore
else
	window.GraphStore = GraphStore

})()

