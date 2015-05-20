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
		console.log('GraphStore.receiveFromDispatcher', payload.actionType)
		switch(payload.actionType) {
			case 'uiGraphTreeReordered':
				this._uiGraphTreeReordered(
					payload.graph,
					payload.original,
					payload.sibling,
					payload.insertAfter)
				break;
			case 'networkNodeAdded':
				this._networkNodeAdded(payload.graph, payload.node, payload.info)
				break;
			case 'uiNodeAdded':
				this._uiNodeAdded(payload.graph, payload.node, payload.info)
				break;
			case 'uiNodeRemoved':
				this._uiNodeRemoved(payload.graph, payload.node, payload.info)
				break;
			case 'networkNodeRemoved':
				this._networkNodeRemoved(payload.graph, payload.node, payload.info)
				break;
			case 'uiNodeRenamed':
				this._uiNodeRenamed(payload.graph, payload.node, payload.title)
				break;
			case 'uiConnected':
				this._uiConnected(payload.graph, payload.connection)
				break;
			case 'networkConnected':
				this._networkConnected(payload.graph, payload.connection)
				break;
			case 'networkDisconnected':
				this._networkDisconnected(payload.graph, payload.connection)
				break;
			case 'uiDisconnected':
				this._uiDisconnected(payload.graph, payload.connection)
				break;
		}
	}.bind(this))
}

GraphStore.prototype._uiGraphTreeReordered = function(graph, original, sibling, insertAfter) {
	graph.reorder_children(original, sibling, insertAfter)
	this.publish('reordered', graph)
	this.emit('changed')
}

// ------------------------------------------------------------------------------

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
		this._uiConnected(graph.parent_graph, connection)
	}

	this.emit('changed')
}

GraphStore.prototype._networkNodeAdded = function(graphId, nodeSpec, info) {
	var graph = Graph.lookup(graphId)
	var node = new Node()//(graph, nodeSpec.plugin, nodeSpec.x, nodeSpec.y)
	node.deserialise(graphId, nodeSpec)
	node.uid = nodeSpec.uid
	node.patch_up(E2.core.graphs)
	node.initialise()

	this._nodeAdded(graph, node, info)
}

GraphStore.prototype._uiNodeAdded = function(graph, node, info) {
	this._nodeAdded(graph, node, info)
	this.broadcast('nodeAdded', graph, node, info)
}

// ------------------------------------------------------------------------------

GraphStore.prototype._networkNodeRemoved = function(graphId, nodeSpec, info) {
	var graph = Graph.lookup(graphId)
	var node = graph.findNodeByUid(nodeSpec.uid)

	mapConnections(node, graph.disconnect.bind(graph))

	graph.removeNode(node)

	this.emit('nodeRemoved', graph, node)
	this.emit('changed')
}

GraphStore.prototype._uiNodeRemoved = function(graph, node, info) {
	mapConnections(node, graph.disconnect.bind(graph))
	graph.removeNode(node)
	this.publish('nodeRemoved', graph, node)
	this.emit('changed')
}

// ------------------------------------------------------------------------------

GraphStore.prototype._uiNodeRenamed = function(graph, node, title) {
	graph.renameNode(node, title)
	this.publish('nodeRenamed', graph, node)
	this.emit('changed')
}

// ------------------------------------------------------------------------------

GraphStore.prototype._uiConnected = function(graph, connection) {
	graph.connect(connection)
	this.publish('connected', graph, connection)
	this.emit('changed')
}

GraphStore.prototype._networkConnected = function(graphId, serCon) {
	var graph = Graph.lookup(graphId)
	var connection = new Connection()
	connection.deserialise(serCon)

	graph.connect(connection)
	
	this.emit('connected', graph, connection)
	this.emit('changed')
}

// ------------------------------------------------------------------------------

GraphStore.prototype._uiDisconnected = function(graph, connection) {
	graph.disconnect(connection)
	this.publish('disconnected', graph, connection)
	this.emit('changed')
}

GraphStore.prototype._networkDisconnected = function(graphId, connection) {
	var graph = Graph.lookup(graphId)
	connection = graph.findConnection(connection.uid)
	graph.disconnect(connection)
	this.emit('disconnected', graph, connection)
	this.emit('changed')
}

if (typeof(module) !== 'undefined')
	module.exports = GraphStore
else
	window.GraphStore = GraphStore

})()

