(function() {

var RECONNECT_INTERVAL = 5000

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
		case 'uiPluginTransientStateChanged':
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

	this.queue = []

	this._dispatcher = dispatcher || E2.app.dispatcher

	this._messageHandlerBound = this._messageHandler.bind(this)

	// send local dispatches to network
	this._dispatcher.register(this._localDispatchHandler.bind(this))
}

EditorChannel.prototype = Object.create(EventEmitter.prototype)

EditorChannel.prototype.close = function() {
	this.wsChannel.close()
}

EditorChannel.prototype.getWsChannel = function() {
	return this.wsChannel
}

var reconnecting = false
EditorChannel.prototype.connect = function(wsHost, wsPort, options) {
	var that = this

	this.kicked = false
	this.connected = false
	this.forking = false

	// listen to messages from network
	this.wsChannel = new WebSocketChannel()
	this.wsChannel
		.connect(wsHost, wsPort, '/__editorChannel', options)
		.on('disconnected', function() {
			if (!that.connected)
				return;

			that.isOnChannel = false
			that.connected = false

			if (that.kicked === true)
				return that.emit('disconnected')

			if (!reconnecting)
				E2.app.growl('Disconnected from server. Reconnecting.', 'reconnecting')

			reconnecting = true
			
			setTimeout(that.connect.bind(that, wsHost, wsPort, options), RECONNECT_INTERVAL)

			that.emit('disconnected')
		})
		.on('ready', function(uid) {
			console.log('EditorChannel ready', uid)
			that.uid = uid

			that.connected = true

			if (reconnecting) {
				reconnecting = false
				E2.app.growl('Reconnected to server!', 'reconnected')
				that.emit('reconnected')
			}

			that.emit('ready', uid)

			that.wsChannel.on('message', function(m) {
				if (m.kind === 'kicked') { // kicked by server
					E2.app.growl('You have been disconnected by the server: '+ m.reason, 'disconnected', 30000)
					that.kicked = true
					return;
				}

				if (m.kind === 'ack') // acknowledgement by id
					that.emit(m.ack, m)

				if (m.channel !== that.channelName)
					return;

				that.emit(m.kind, m)
			})

			that.processQueue()
		})

	return this
}

EditorChannel.prototype.snapshot = function() {
	var graphSer = E2.core.serialise()

	E2.app.snapshotPending = false

	this.send({
		actionType: 'graphSnapshotted',
		data: graphSer
	})
}

/**
 * send local dispatches to network
 * FORK if an important edit (create a new channel with copy)
 */
EditorChannel.prototype._localDispatchHandler = function _localDispatchHandler(payload) {
	if (payload.from)
		return

	if (this.isOnChannel)
		return this.send(payload)

	// not on channel -- fork if important
	if (!isEditAction(payload)) // eg. mouseMove
		return

	this.fork(payload)
}

EditorChannel.prototype.fork = function(payload) {
	var that = this

	if (this.forking)
		return this.queue.push(payload)

	this.forking = true

	E2.ui.updateProgressBar(65)

	// FORK
	var fc = new ForkCommand()
	fc.fork(payload)
		.then(function() {
			E2.ui.updateProgressBar(100)
			E2.app.growl("We've made a copy of this for you to edit.", 'copy', 5000)
		})
		.catch(function(err) {
			E2.app.growl('Error while forking: ' + err, 'error')
			throw err
		})
		.finally(function() {
			that.forking = false

			var forkQueue = that.queue.slice()
			that.queue = []

			while(forkQueue.length) {
				var dispatch = forkQueue.pop()
				// re-dispatch queued events after snapshot
				E2.app.dispatcher.dispatch(dispatch)
			}
		})
}

EditorChannel.prototype.leave = function() {
	this.wsChannel.leave(this.channelName)

	ga('send', 'event', 'editorChannel', 'left', this.channelName)

	this.wsChannel.removeListener(this.channelName, this._messageHandlerBound)

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

EditorChannel.prototype.join = function(channelName, readableName, cb) {
	var that = this

	if (this.channelName && this.channelName !== channelName) {
		this.leave()
	}

	this.channelName = channelName

	var joinMessage = {
		kind: 'join',
		channel: channelName,
		readableName: readableName,
		activeGraphUid: E2.core.active_graph.uid,
		lastEditSeen: this.lastEditSeen
	}

	this.wsChannel.ws.send(JSON.stringify(joinMessage))

	function waitForOwnJoin(pl) {
		if (pl.kind === 'youJoined' && pl.channel === channelName) {
			that.wsChannel.removeListener(channelName, waitForOwnJoin)
			
			ga('send', 'event', 'editorChannel', 'joined', channelName)

			that.isOnChannel = true
			
			if (cb)
				cb()
		}
	}

	this.wsChannel.on(channelName, waitForOwnJoin)
	this.wsChannel.on(channelName, this._messageHandlerBound)
}

EditorChannel.prototype.canSend = function() {
	return !this.forking && this.connected
}

EditorChannel.prototype.send = function(payload) {
	if (!isAcceptedDispatch(payload))
		return;

	if (E2.app.snapshotPending && isEditAction(payload))
		return this.snapshot()

	if (this.canSend() && !this.queue.length)
		return this.sendPayload(payload)

	this.queue.push(payload)

	this.processQueue()
}

EditorChannel.prototype.sendPayload = function(payload) {
	this.wsChannel.send(
		payload.channel === 'Global' ? payload.channel : this.channelName,
		dehydrate(payload))
}

EditorChannel.prototype.processQueue = function() {
	if (!this.canSend() || !this.queue.length)
		return;

	var payload = this.queue.pop()

	this.wsChannel.send(
		payload.channel === 'Global' ? payload.channel : this.channelName,
		dehydrate(payload))

	this.processQueue()
}

if (typeof(module) !== 'undefined')
	module.exports = EditorChannel
else
	E2.EditorChannel = EditorChannel

})();

