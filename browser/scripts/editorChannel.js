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

function hydrate(pl) {
	var m = _.clone(pl)
	switch(m.actionType) {
		case 'uiNodeAdded':
			m.node = Node.hydrate(pl.graphUid, pl.node)
			break;
		case 'uiConnected':
			m.connection = Connection.hydrate(Graph.lookup(pl.graphUid), pl.connection)
			break;
	}

	return m;
}

function dehydrate(m) {
	var pl = _.clone(m)

	switch(m.actionType) {
		case 'uiNodeAdded':
			pl.node = m.node.serialise()
			break;
		case 'uiConnected':
			pl.connection = m.connection.serialise()
			break;
	}

	return pl;
}

function isAcceptedDispatch(m) {
	switch(m.actionType) {
		case 'uiNodeAdded':
		case 'uiNodeRemoved':
		case 'uiNodeRenamed':
		case 'uiSlotAdded':
		case 'uiSlotRemoved':
		case 'uiNodeOpenStateChanged':
		case 'uiNodesMoved':
		case 'uiConnected':
		case 'uiDisconnected':
		case 'uiGraphTreeReordered':
		case 'uiPluginStateChanged':

		case 'uiMouseMoved':
		case 'uiMouseClicked':
		case 'uiUserIdFollowed':
		case 'uiUserIdUnfollowed':
		case 'uiActiveGraphChanged':
			return true;
	}

	// console.warn('NOT ACCEPTED:', m)

	return false;
}

function EditorChannel() {
	EventEmitter.call(this)

	var that = this

	this.channel = new WebSocketChannel()

	this.channel
		.connect('/__editorChannel')
		.on('disconnected', function() {
			E2.app.growl('Disconnected from server')
		})
		.on('ready', function(uid) {
			that.uid = uid

			that.emit('ready', uid)

			that.channel.on('*', function(m) {
				that.emit(m.kind, m)
			})
		})

	E2.app.dispatcher.register(function channelGotDispatch(payload) {
		if (payload.from)
			return;

		if (isAcceptedDispatch(payload))
			that.broadcast(dehydrate(payload))
	})

}

EditorChannel.prototype = Object.create(EventEmitter.prototype)

EditorChannel.prototype.leave = function(channelName) {
	this.channel.leave(channelName)
	this.emit('leave', { id: this.uid })
}

EditorChannel.prototype.join = function(channelName) {
	if (this.channelName && this.channelName !== channelName) {
		this.leave(this.channelName)
	}

	this.channelName = channelName

	this.channel.ws.send(JSON.stringify({
		kind: 'join',
		channel: channelName,
		activeGraphUid: E2.core.active_graph.uid
	}))

	this.channel
		.on('*', function(payload) {
			if (!payload.actionType || !payload.from)
				return;

			if (isAcceptedDispatch(payload))
				E2.app.dispatcher.dispatch(hydrate(payload))
		})
}

EditorChannel.prototype.broadcast = function(payload) {
	this.channel.send(this.channelName, payload)
}

if (typeof(module) !== 'undefined')
	module.exports = EditorChannel
else
	window.EditorChannel = EditorChannel

})();