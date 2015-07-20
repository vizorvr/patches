(function() {

var RECONNECT_INTERVAL = 5000

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

function EditorChannel(dispatcher) {
	EventEmitter.call(this)

	var that = this

	this._dispatcher = dispatcher || E2.app.dispatcher

	this._messageHandlerBound = this._messageHandler.bind(this)

	this._dispatcher.register(function channelGotDispatch(payload) {
		if (payload.from)
			return;

		if (isAcceptedDispatch(payload)) {
			that.send(dehydrate(payload))
		}
	})

}

EditorChannel.prototype = Object.create(EventEmitter.prototype)

EditorChannel.prototype.close = function() {
	this.channel.close()
}

EditorChannel.prototype.connect = function(options) {
	var that = this
	var reconnecting = false

	this.channel = new WebSocketChannel()
	this.channel
		.connect('/__editorChannel', options)
		.on('disconnected', function() {
			if (!reconnecting)
				E2.app.growl('Disconnected from server. Reconnecting.')

			reconnecting = true
			setTimeout(that.connect.bind(that), RECONNECT_INTERVAL)

			that.emit('disconnected')
		})
		.on('ready', function(uid) {
			that.uid = uid

			that.emit('ready', uid)

			if (reconnecting) {
				reconnecting = false
				E2.app.growl('Connected to server!')
				that.emit('reconnected')
			}

			that.channel.on('*', function(m) {
				that.emit(m.kind, m)
			})
		})

	return this
}

EditorChannel.prototype.leave = function() {
	this.channel.removeListener(this.channelName, this._messageHandlerBound)
	this.channel.leave(this.channelName)
	this.emit('leave', { id: this.uid })
}

EditorChannel.prototype._messageHandler = function _messageHandler(payload) {
	if (!payload.actionType || !payload.from)
		return;

	if (isAcceptedDispatch(payload))
		this._dispatcher.dispatch(hydrate(payload))
}

EditorChannel.prototype.join = function(channelName, cb) {
	var that = this

	if (this.channelName && this.channelName !== channelName) {
		this.leave()
	}

	this.channelName = channelName

	this.channel.ws.send(JSON.stringify({
		kind: 'join',
		channel: channelName,
		activeGraphUid: E2.core.active_graph.uid
	}))

	function waitForOwnJoin(pl) {
		if (pl.kind === 'youJoined' && pl.channel === channelName) {
			that.channel.removeListener(channelName, waitForOwnJoin)
			if (cb)
				cb()
		}
	}

	this.channel.on(channelName, waitForOwnJoin)
	this.channel.on(channelName, this._messageHandlerBound)
}

EditorChannel.prototype.send = function(payload) {
	this.channel.send(this.channelName, payload)
}

if (typeof(module) !== 'undefined')
	module.exports = EditorChannel
else
	window.EditorChannel = EditorChannel

})();
