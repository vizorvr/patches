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

function hydrate(m) {
	m.graph = Graph.lookup(m.graphUid)

	switch(m.actionType) {
		case 'uiNodeAdded':
		case 'uiNodeRemoved':
		case 'uiNodeRenamed':
			m.node = Node.hydrate(m.guid, m.node)
			break;
		case 'uiNodesMoved':
			break;
		case 'uiConnected':
			break;
		case 'uiDisconnected':
			break;
		case 'uiGraphTreeReordered':
		case 'uiPluginStateChanged':
			
	}

	return m;
}

function isAcceptedDispatch(m) {
	switch(m.actionType) {
		case 'uiNodeAdded':
		case 'uiNodeRemoved':
		case 'uiNodeRenamed':
		case 'uiNodesMoved':
		case 'uiConnected':
		case 'uiDisconnected':
		case 'uiGraphTreeReordered':
		case 'uiPluginStateChanged':
			return true;
	}

	console.log('NOT ACCEPTED:', m)

	return false;
}

function EditorChannel() {
	EventEmitter.call(this)

	var that = this

	this.channel = new WebSocketChannel()

	this.channel
		.connect()
		.on('connected', function() {
			that.channel.join('__editor__')
			.on('*', function(payload) {
				if (!payload.actionType || !payload.from)
					return;

				console.log('EditorChannel IN: ', payload.actionType, payload)

				if (isAcceptedDispatch(payload))
					E2.app.dispatcher.dispatch(payload)

			})
		})

	E2.app.dispatcher.register(function channelGotDispatch(payload) {
		if (payload.from)
			return;

		console.log('EditorChannel.channelGotDispatch', payload)

		if (isAcceptedDispatch(payload))
			that.broadcast(payload)
	})

}

EditorChannel.prototype = Object.create(EventEmitter.prototype)

EditorChannel.prototype.broadcast = function(payload) {
	this.channel.send('__editor__', payload)
}

if (typeof(module) !== 'undefined')
	module.exports = EditorChannel
else
	window.EditorChannel = EditorChannel

})();