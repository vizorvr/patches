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
	E2.app.channel.on('nodeAdded', function nodeAdded(guid, node) {
		var graph = graphLookup(guid)
		var inode = new Node()
		inode.deserialise(guid, node)
		// debugger;
		graph.addNode(inode)
		inode.patch_up(E2.core.graphs)
		this.emit('nodeAdded', graph, inode)
	}.bind(this))

	E2.app.dispatcher.register(function receiveFromDispatcher(payload) {
		console.log('GraphStore received',payload)
		switch(payload.actionType) {
			case 'uiNodeAdded':
				this.uiNodeAdded(payload.graph, payload.node)
				break;
			case 'uiNodeRemoved':
				this.uiNodeRemoved(payload.graph, payload.node)
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

GraphStore.prototype.uiNodeAdded = function(graph, node) {
	graph.addNode(node)
	mapConnections(node, function(conn) {
		graph.connect(conn)
	})
	this.publish('nodeAdded', graph, node)
}

GraphStore.prototype.uiNodeRemoved = function(graph, node) {
	mapConnections(node, function(conn) {
		// removing a node, all its connections should be removed
		graph.disconnect(conn)
	})
	graph.removeNode(node)
	this.publish('uiNodeRemoved', graph, node)
}

GraphStore.prototype.uiConnected = function(graph, connection) {
	graph.connect(connection)
	this.publish('uiConnected', graph, connection)
}

GraphStore.prototype.uiDisconnected = function(graph, connection) {
	graph.connect(connection)
	this.publish('uiDisconnected', graph, connection)
}

if (typeof(module) !== 'undefined')
	module.exports = GraphStore
else
	window.GraphStore = GraphStore

})()

