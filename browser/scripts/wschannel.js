if (typeof(module) !== 'undefined') {
	EventEmitter = require('events').EventEmitter
}

function WebSocketChannel() {
	EventEmitter.call(this)
	this._listeners = {}
	this._state = 'disconnected'
}

WebSocketChannel.prototype = Object.create(EventEmitter.prototype)

WebSocketChannel.prototype.connect = function(path) {
	var that = this

	path = path || '/__wschannel'

	if (this._state === 'connected' || this._state === 'connecting')
		return

	this._state = 'connecting'

	this.ws = new WebSocket('ws://'+
		window.location.hostname+':'+
		(window.location.port || 80)+
		path)

	this.ws.onopen = function() {
		console.log('WsChannel connected', path)
		that._state = 'connected'
		that.emit('connected')
	}

	this.ws.onclose = function() {
		console.warn('WsChannel disconnected', path)
		that._state = 'disconnected'
		that.emit('disconnected')
	}

	this.ws.onmessage = function(evt) {
		var m = JSON.parse(evt.data)

		if (m.kind === 'READY') {
			that.uid = m.id
			that.emit('ready', that.uid)
		}

		that.emit('*', m)
		that.emit(m.channel, m)
	}

	return this
}

WebSocketChannel.prototype.close = function() {
	this.ws.close()
}

WebSocketChannel.prototype.join = function(channel) {
	if (this._state !== 'connected')
		return;

	console.log('WsChannel.join',channel, this.uid)

	this.ws.send(JSON.stringify({ kind: 'join', channel: channel }))
	return this
}

WebSocketChannel.prototype.leave = function(channel) {
	if (this._state !== 'connected')
		return;

	console.log('WsChannel.leave',channel,this.uid)

	this.ws.send(JSON.stringify({ kind: 'leave', channel: channel }))

	return this
}

WebSocketChannel.prototype.send = function(channel, data) {
	if (this._state !== 'connected')
		return;

	if (typeof(data) !== 'object')
		data = { kind: data }

	data.channel = channel

	console.log('OUT:', channel, data)
	this.ws.send(JSON.stringify(data))

	return this
}

if (typeof(module) !== 'undefined')
	module.exports = WebSocketChannel

