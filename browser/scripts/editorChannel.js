(function() {

function serialize(objects) {
	return objects.map(function(ob) {
		if (!ob)
			return ob;

		if (ob instanceof Graph)
			return ob.uid

		if (!ob.serialise) {
			return ob;
		}

		return ob.serialise()
	})
}

function serializeEvent(evt) {
	var otwMessage = {
		type: evt
	}

	var objects = Array.prototype.slice.call(arguments, 1)

	otwMessage.objects = serialize(objects)

	return otwMessage
}

function EditorChannel() {
	EventEmitter.call(this)

	var that = this
	wsChannel
		.join('__editor__')
		.on('*', function(m) {
			console.log('EditorChannel IN: ', m.type)
			this.emit.apply(this, [m.type].concat(m.objects))

			switch(m.type) {
				case 'nodeAdded':
					E2.app.dispatcher.dispatch({
						actionType: 'networkNodeAdded',
						graph: m.objects[0],
						node: m.objects[1],
						info: m.objects[2]
					})
					break;
				case 'nodeRemoved':
					E2.app.dispatcher.dispatch({
						actionType: 'networkNodeRemoved',
						graph: m.objects[0],
						node: m.objects[1],
						info: m.objects[2]
					})
					break;
				case 'connected':
					E2.app.dispatcher.dispatch({
						actionType: 'networkConnected',
						graph: m.objects[0],
						connection: m.objects[1]
					})
					break;
				case 'disconnected':
					E2.app.dispatcher.dispatch({
						actionType: 'networkDisconnected',
						graph: m.objects[0],
						connection: m.objects[1]
					})
					break;

				case 'pluginStateChanged':
					var graph = Graph.lookup(m.objects[0])
					var node = graph.findNodeByUid(m.objects[1].uid)
					var key = m.objects[2]
					var newValue = m.objects[3]

					node.plugin.state[key] = newValue
					node.plugin.updated = true

					if (node.ui)
						node.plugin.state_changed(node.ui.plugin_ui)

					break;
			}
		}.bind(this))
}

EditorChannel.prototype = Object.create(EventEmitter.prototype)

EditorChannel.prototype.broadcast = function() {
	var om = serializeEvent.apply(this, arguments)
	console.log('BROADCAST:', om, arguments)
	wsChannel.send('__editor__', om)
}

if (typeof(module) !== 'undefined')
	module.exports = EditorChannel
else
	window.EditorChannel = EditorChannel

})();