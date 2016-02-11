(function() {

var assetLoadingPlugins = [
	'three_loader_model',
	'three_loader_scene',
	'url_texture_generator',
	'url_audio_buffer_generator',
	'url_audio_generator',
	'url_json_generator',
	'url_video_generator',
]

function mapConnections(node, fn) {
	node.inputs.concat(node.outputs).map(fn)
}

function GraphStore() {
	Store.apply(this, arguments)
	this._setupListeners()
	this.storeName = 'graph'

	// keep track of graph size
	this.stat = {
		size: 0,
		numAssets: 0
	}
}

GraphStore.prototype = Object.create(Store.prototype)

GraphStore.prototype._setupListeners = function() {
	E2.core.on('vizorFileLoaded', this._calculateGraphSize.bind(this))

	E2.app.dispatcher.register(function receiveFromDispatcher(payload) {
		if (payload.actionType === 'graphSnapshotted')
			return this._graphSnapshotted(payload.data)

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
			case 'uiPluginTransientStateChanged':
				this._uiPluginTransientStateChanged(
					graph,
					payload.nodeUid,
					payload.key,
					payload.value)
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

GraphStore.prototype._graphSnapshotted = function(data) {
	E2.app.player.load_from_json(data)
	this.emit('snapshotted')
	this.emit('changed')
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

	this.assetsMayHaveChanged(node)

	this.emit('nodeAdded', graph, node, info)

	if (info && info.proxy && info.proxy.connection) {
		this._uiConnected(graph.parent_graph,
			Connection.hydrate(graph.parent_graph, info.proxy.connection)
		)
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

	this.assetsMayHaveChanged(node)

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
	var c = connection

	/*
		for dynamic slots, the index could have changed in eg.
		a redo situation. recalculate the current index in the node
		by looking up the slot with its uid; issue 195
	 */
	if (c.dst_slot.dynamic) {
		c.dst_slot.index = c.dst_node.find_dynamic_slot(
			E2.slot_type.input,
			c.dst_slot.uid
		).index
	}

	if (c.src_slot.dynamic) {
		c.src_slot.index = c.src_node.find_dynamic_slot(
			E2.slot_type.output,
			c.src_slot.uid
		).index
	}

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

GraphStore.prototype.assetsMayHaveChanged = function(node) {
	if (assetLoadingPlugins.indexOf(node.plugin.id) === 0)
		return;

	this._calculateGraphSize()
}

GraphStore.prototype._calculateGraphSize = function() {
	var that = this

	console.time('_calculateGraphSize')

	if (this._statDfd) {
		return this._statDfd
		.then(function() {
			that._calculateGraphSize()
		})
	}

	this._statDfd = new E2.GraphAnalyser(new E2.GridFsClient())
		.analyseGraph(E2.core.root_graph)
		.then(function(stat) {
			console.timeEnd('_calculateGraphSize')
			that.stat = stat
			console.log('graph size', that.stat)
			that.emit('changed:size', that.stat.size)
		})
		.finally(function() {
			that._statDfd = null
		})
}

GraphStore.prototype.getGraphSize = function() {
	return this.stat
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

GraphStore.prototype._uiPluginTransientStateChanged = function(graph, nodeUid, key, value) {
	return this._uiPluginStateChanged(graph, nodeUid, key, value)
}

GraphStore.prototype._uiPluginStateChanged = function(graph, nodeUid, key, value) {
	var node = graph.findNodeByUid(nodeUid)
	node.setPluginState(key, value)
	this.assetsMayHaveChanged(node)
	this.emit('changed')
}

if (typeof(module) !== 'undefined')
	module.exports = GraphStore
else
	window.GraphStore = GraphStore

})();

