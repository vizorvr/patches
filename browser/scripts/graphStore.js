(function() {

function mapConnections(node, fn) {
	node.inputs.concat(node.outputs).map(fn)
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
			case 'networkNodeAdded':
				this.networkNodeAdded(payload.graph, payload.node, payload.info)
				break;
			case 'uiNodeAdded':
				this.uiNodeAdded(payload.graph, payload.node, payload.info)
				break;
			case 'uiNodeRemoved':
				this.uiNodeRemoved(payload.graph, payload.node, payload.info)
				break;
			case 'networkNodeRemoved':
				this.networkNodeRemoved(payload.graph, payload.node, payload.info)
				break;
			case 'uiNodeRenamed':
				this.uiNodeRenamed(payload.graph, payload.node, payload.title)
				break;
			case 'uiConnected':
				this.uiConnected(payload.graph, payload.connection)
				break;
			case 'networkConnected':
				this.networkConnected(payload.graph, payload.connection)
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

GraphStore.prototype._nodeAdded = function(graph, node, info) {
	graph.addNode(node, info)

	mapConnections(node, function(conn) {
		graph.connect(conn)
	})

	this.emit('nodeAdded', graph, node, info)

	if (info && info.proxy && info.proxy.connection) {
		console.log('re-adding', info.proxy.connection)
		var connection = new Connection()
		connection.deserialise(info.proxy.connection)
		this.uiConnected(graph.parent_graph, connection)
	}

	this.emit('changed')
}

GraphStore.prototype.networkNodeAdded = function(graphId, nodeSpec, info) {
	var graph = Graph.lookup(graphId)
	var node = new Node(graph, nodeSpec.plugin, nodeSpec.x, nodeSpec.y)
	node.uid = nodeSpec.uid
	node.reset()

	this._nodeAdded(graph, node, info)
}

GraphStore.prototype.uiNodeAdded = function(graph, node, info) {
	this._nodeAdded(graph, node, info)
	this.broadcast('nodeAdded', graph, node, info)
}

GraphStore.prototype.networkNodeRemoved = function(graph, node, info) {
	mapConnections(node, function(conn) {
		// removing a node, all its connections should be removed
		graph.disconnect(conn)
	})

	graph.removeNode(node)

	this.broadcast('nodeRemoved', graph, node)

	this.emit('changed')
}

GraphStore.prototype.uiNodeRemoved = function(graph, node, info) {
	mapConnections(node, function(conn) {
		// removing a node, all its connections should be removed
		graph.disconnect(conn)
	})

	graph.removeNode(node)

	this.publish('nodeRemoved', graph, node)

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

GraphStore.prototype.networkConnected = function(graphId, serCon) {
	var graph = Graph.lookup(graphId)
	var connection = new Connection()
	connection.deserialise(serCon)

	graph.connect(connection)
	
	this.emit('connected', graph, connection)

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

