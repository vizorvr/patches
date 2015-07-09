var EventEmitter = require('events').EventEmitter
var WebSocketServer = require('ws').Server
var config = require('../config/config.json').server
var crypto = require('crypto')
var r = require('rethinkdb')
var when = require('when')

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
	this.send(client, { error: err })
}

function EditorChannelServer() {
	EventEmitter.call(this)
	this.config = config
	this.clients = {}
	this.channels = {}
	this.dispatchQueue = []
}

EditorChannelServer.prototype = Object.create(EventEmitter.prototype)

EditorChannelServer.prototype.listen = function(httpServer) {
	var that = this

	this._setupDatabase()
	.then(function() {
		that.wss = new WebSocketServer( {
			server: httpServer,
			path: '/__editorChannel'
		})

		that.wss.on('connection', that.handleConnection.bind(that))

		that.emit('ready')
	
		console.log('EditorChannelServer ready')
	})
	.catch(function(err) {
		throw err
	})
}

EditorChannelServer.prototype._setupDatabase = function() {
	var that = this
	var dbName = process.env.RETHINKDB_NAME || 'vizor'
	var dfd = when.defer()

	r.connect({
		host: process.env.RETHINKDB_HOST || 'localhost',
		port: 28015,
		db: dbName
	}, function(err, conn) {
		if (err)
			return dfd.reject(err)

		that._rethinkConnection = conn

		r.dbCreate(dbName)
		.run(conn, function(err) {
			r.db(dbName).tableCreate('editlog')
			.run(conn, function(err, result) {
				// swallow table already exists
				if (err && err.name !== 'RqlRuntimeError') 
					return dfd.reject(err)

				dfd.resolve()
			})
		})
	})

	return dfd.promise
}

EditorChannelServer.prototype.close = function() {
	this.wss.close()
	this.clients = {}
	this.channels = {}
	this._rethinkConnection.close()
}

EditorChannelServer.prototype.handleConnection = function(socket) {
	var that = this

	var client = {
		socket: socket,
		state: 'init',
		id: crypto.randomBytes(20).toString('hex'),
		color: '#' + Math.floor(Math.random() * 16777215).toString(16),
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

	this.send(client, {
		kind: 'READY',
		id: client.id,
		color: client.color
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

			switch(message.actionType) {
				case 'uiActiveGraphChanged':
				case 'uiMouseMoved':
				case 'uiMouseClicked':
					return this.sendToChannel(message.channel, message, message.from)
				default:
					this.queue({
						channel: message.channel,
						from: client.id,
						message: message
					})

					this.dispatch()
					break;
			}

			break
	}
}

EditorChannelServer.prototype.queue = function(dispatchObject) {
	this.dispatchQueue.push(dispatchObject)
}

var localSerial = 0
EditorChannelServer.prototype.dispatch = function() {
	var that = this

	if (this.dispatching || !this.dispatchQueue.length)
		return;

	this.dispatching = true

	var dsp = this.dispatchQueue.shift()

	r.table('editlog')
	.insert({
		id: Date.now() + '' + localSerial++,
		name: dsp.channel,
		from: dsp.from,
		log: JSON.stringify(dsp.message)
	})
	.run(this._rethinkConnection, {durability: 'hard'}, function(err, result) {
		if (err)
			console.error(err.stack)

		that.dispatching = false

		that.dispatch()
	})
}

EditorChannelServer.prototype.tail = function(channelName, client) {
	var that = this

	r.table('editlog')
	.filter(r.row('name').eq(channelName))
	.orderBy('id')
	.run(that._rethinkConnection, function(err, cursor) {
		if (err)
			return clientErrorReporter(client, err)

		cursor.each(function(err, row) {
			that.sendString(client, row.log)
		})
	})

	r.table('editlog')
	.filter(r.row('name').eq(channelName))
	.changes()
	.run(this._rethinkConnection, function(err, cursor) {
		if (err)
			return clientErrorReporter(client, err)
		
		if (client.cursor)
			client.cursor.close()

		client.cursor = cursor

		cursor.each(function(err, dsp) {
			if (err)
				return clientErrorReporter(client, err)

			var log = dsp.new_val.log

			if (dsp.new_val.from !== client.id)
				that.sendString(client, log)
		})
	})
}

EditorChannelServer.prototype.joinChannel = function(channelName, client) {
	var that = this

	if (this.config.debug)
		console.log('EditorChannelServer Join:', channelName, client.id)

	if (client.channels.indexOf(channelName) !== -1)
		return

	this.tail(channelName, client)

	if (!this.channels[channelName])
		this.channels[channelName] = []

	var members = this.channels[channelName]

	client.channels.push(channelName)

	members.map(function(oc) {
		that.send(client, {
			channel: channelName,
			kind: 'join',
			id: oc.id,
			color: oc.color
		})
	})

	members.push(client)

	this.sendToChannel(channelName, {
		channel: channelName,
		kind: 'join',
		color: client.color,
		id: client.id
	})
}

EditorChannelServer.prototype.leaveChannel = function(channelName, client) {
	if (this.config.debug)
		console.log('EditorChannelServer Leave:', channelName, client.id)

	if (!this.channels[channelName] || this.channels[channelName].indexOf(client) === -1)
		return

	this.sendToChannel(channelName, {
		channel: channelName, kind: 'leave', id: client.id
	}, client.id)

	if (client.cursor)
		client.cursor.close()

	this.channels[channelName] = this.channels[channelName].filter(function(cl) {
		return (client.id !== cl.id)
	})

	client.channels = client.channels.filter(function(ch) {
		return (ch !== channelName)
	})
}

EditorChannelServer.prototype.sendToChannel = function(channelName, message, exceptId) {
	var that = this

	if (!this.channels[channelName])
		return;

	this.channels[channelName].map(function(client) {
		if (exceptId === client.id)
			return;

		console.log('send: client', client.id, message.actionType)

		that.send(client, message)
	})

	this.emit(channelName, message)
}

EditorChannelServer.prototype.send = function(client, message) {
	this.sendString(client, encode(message))
}

EditorChannelServer.prototype.sendString = function(client, message) {
	if (client.socket.readyState !== 1) 
		return;

	client.socket.send(message, onSocketError)
}

exports.EditorChannelServer = EditorChannelServer

