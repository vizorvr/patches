var EventEmitter = require('events').EventEmitter
var WebSocketServer = require('ws').Server
var config = require('../config/config.json').server
var crypto = require('crypto')
var mongoose = require('mongoose')

require('../models/editLog')

var editLogs = {}

var EditLog

function encode(obj) {
	if(!obj.channel)
		obj.channel = 'server'

	if(!obj.from)
		obj.from = 'server'

	return JSON.stringify(obj)
}

function onSocketError(err) {
	if (err)
		console.error('Error writing to socket:', err.stack)
}

function clientErrorReporter(client, err) {
	console.error(err)
	this.send(client.socket, { error: err })
}

function EditorChannelServer() {
	EventEmitter.call(this)
	this.config = config
	this.clients = {}
	this.channels = {}

	EditLog = mongoose.model('EditLog')
}

EditorChannelServer.prototype = Object.create(EventEmitter.prototype)

EditorChannelServer.prototype.listen = function(httpServer) {
	var that = this

	this.wss = new WebSocketServer( {
		server: httpServer,
		path: '/__editorChannel'
	})

	this.wss.on('connection', this.handleConnection.bind(this))

	console.log('EditorChannelServer ready')
}

EditorChannelServer.prototype.close = function() {
	this.wss.close()
	this.clients = {}
	this.channels = {}
}

EditorChannelServer.prototype.handleConnection = function(socket) {
	var that = this

	var client = {
		socket: socket,
		id: crypto.randomBytes(20).toString('hex'),
		channels: []
	}

	this.clients[client.id] = client

	socket.on('message', this.handleMessage.bind(this, client))
	socket.on('close', function() {
		client.channels.map(function(ch) {
			that.leaveChannel(ch, client)
		})

		delete that.clients[client.id]
	}.bind(this))

	this.send(socket, {
		kind: 'READY', data: client.id
	})

	return client
}

EditorChannelServer.prototype.handleMessage = function(client, m) {
	var message = JSON.parse(m)
	message.from = client.id

	if (!message.channel)
		return

	switch(message.kind) {
		case 'join':
			this.joinChannel(message.channel, client)
			break

		case 'leave':
			this.leaveChannel(message.channel, client)
			break

		default:
			if (!message.actionType)
				return;

			this.dispatch(message)
				.catch(clientErrorReporter.bind(this, client))

			break
	}
}

EditorChannelServer.prototype.dispatch = function(message) {
	var that = this
	var clientId = message.from

	return new EditLog({
		name: message.channel,
		log: message
	})
	.promiseSave()
	.then(function() {
		console.log('wrote',message.actionType)
		that.sendToChannel(message.channel, message, clientId)
	})
}

EditorChannelServer.prototype.sendDispatchesToClient = function(channelName, client) {
	var that = this
	var count = 0 

	EditLog.map(channelName, function(edit) {
		count++
		that.send(client.socket, edit.log)
	})
	.catch(clientErrorReporter.bind(this, client))
	.then(function() {
		console.log('EditorChannelServer.sendEdits sent', count, 'messages for', channelName)
	})
}

EditorChannelServer.prototype.joinChannel = function(channelName, client) {
	var that = this

	if (this.config.debug)
		console.log('EditorChannelServer Join:', channelName, client.id)

	if (client.channels.indexOf(channelName) !== -1)
		return

	if (!this.channels[channelName])
		this.channels[channelName] = []

	var members = this.channels[channelName]

	client.channels.push(channelName)
	members.push(client)

	this.sendToChannel(channelName, {
		channel: channelName,
		kind: 'join',
		data: client.id
	}, client.id)
	
	members.map(function(oc) {
		if (oc.id === client.id)
			return

		that.send(client.socket, {
			channel: channelName, kind: 'join', data: oc.id
		})
	})

	this.sendDispatchesToClient(channelName, client)
}

EditorChannelServer.prototype.leaveChannel = function(channelName, client) {
	if (this.config.debug)
		console.log('EditorChannelServer Leave:', channelName, client.id)

	if (!this.channels[channelName] || this.channels[channelName].indexOf(client) === -1)
		return

	this.sendToChannel(channelName, {
		channel: channelName, kind: 'leave', data: client.id
	}, client.id)

	this.channels[channelName] = this.channels[channelName].filter(function(cl) {
		return (client.id !== cl.id)
	})

	client.channels = client.channels.filter(function(ch) {
		return (ch !== channelName)
	})
}

EditorChannelServer.prototype.sendToChannel = function(channelName, message, exceptId) {
	if (!this.channels[channelName])
		return

	this.channels[channelName].map(function(client) {
		if (exceptId !== client.id)
			this.send(client.socket, message)
	}.bind(this))

	this.emit(channelName, message)
}

EditorChannelServer.prototype.send = function(socket, message) {
	if (socket.readyState === 1)
		socket.send(encode(message), onSocketError)
}

exports.EditorChannelServer = EditorChannelServer
