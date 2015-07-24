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

function isEditAction(m) {
	switch(m.actionType) {
		case 'graphSnapshotted':
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
			return true;
	}

	return false;
}

function isAcceptedDispatch(m) {
	if (isEditAction(m))
		return true;

	switch(m.actionType) {
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

	this.isOnChannel = false
	this.lastEditSeen = null

	this._dispatcher = dispatcher || E2.app.dispatcher

	this._messageHandlerBound = this._messageHandler.bind(this)

	// send local dispatches to network
	this._dispatcher.register(this._localDispatchHandler.bind(this))
}

EditorChannel.prototype = Object.create(EventEmitter.prototype)

EditorChannel.prototype.close = function() {
	this.channel.close()
}

var reconnecting = false
EditorChannel.prototype.connect = function(options) {
	var that = this

	// listen to messages from network
	this.channel = new WebSocketChannel()
	this.channel
		.connect('/__editorChannel', options)
		.on('disconnected', function() {
			if (!reconnecting)
				E2.app.growl('Disconnected from server. Reconnecting.')

			reconnecting = true
			setTimeout(that.connect.bind(that), RECONNECT_INTERVAL)

			that.isOnChannel = false
			that.emit('disconnected')
		})
		.on('ready', function(uid) {
			that.uid = uid

			that.emit('ready', uid)

			if (reconnecting) {
				reconnecting = false
				E2.app.growl('Reconnected to server!')
				that.emit('reconnected')
			}

			that.channel.on('*', function(m) {
				that.emit(m.kind, m)
			})
		})

	return this
}

/**
 * send local dispatches to network
 * FORK if an important edit (create a new channel with copy)
 */
EditorChannel.prototype._localDispatchHandler = function _localDispatchHandler(payload) {
	if (payload.from)
		return;

	if (this.isOnChannel)
		return this.send(payload)

	// not on channel -- fork if important
	if (!isEditAction(payload)) // eg. mouseMove
		return;

	this.fork(payload)
}

EditorChannel.prototype.fork = function(payload) {
	E2.dom.load_spinner.show()

	// FORK
	var fc = new ForkCommand()
	fc.fork(payload)
		.then(function() {
			E2.dom.load_spinner.hide()
			E2.app.growl("We've made a copy of this for you to edit.",
				5000)
		})
		.catch(function(err) {
			E2.app.growl('Error while forking: ' + err)
			throw err
		})
}

EditorChannel.prototype.leave = function() {
	this.channel.leave(this.channelName)

	this.channel.removeListener(this.channelName, this._messageHandlerBound)
	this.isOnChannel = false
	this.lastEditSeen = null
	this.channelName = null
	this.emit('leave', { id: this.uid })
}

EditorChannel.prototype._messageHandler = function _messageHandler(payload) {
	if (!isAcceptedDispatch(payload))
		return;

	this.lastEditSeen = payload.id

	if (payload.from === this.uid)
		return;

	this._dispatcher.dispatch(hydrate(payload))
}

EditorChannel.prototype.join = function(channelName, cb) {
	var that = this

	if (this.channelName && this.channelName !== channelName) {
		this.leave()
	}

	this.channelName = channelName

	var joinMessage = {
		kind: 'join',
		channel: channelName,
		activeGraphUid: E2.core.active_graph.uid,
		lastEditSeen: this.lastEditSeen
	}

	this.channel.ws.send(JSON.stringify(joinMessage))

	function waitForOwnJoin(pl) {
		if (pl.kind === 'youJoined' && pl.channel === channelName) {
			that.channel.removeListener(channelName, waitForOwnJoin)
			
			that.isOnChannel = true
			
			if (cb)
				cb()
		}
	}

	this.channel.on(channelName, waitForOwnJoin)
	this.channel.on(channelName, this._messageHandlerBound)
}

EditorChannel.prototype.send = function(payload) {
	if (!isAcceptedDispatch(payload))
		return;

	this.channel.send(this.channelName, dehydrate(payload))
}

if (typeof(module) !== 'undefined')
	module.exports = EditorChannel
else
	window.EditorChannel = EditorChannel

})();
