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

var localSerial = 0
EditorChannelServer.prototype.dispatch = function(message) {
	var that = this

	var dfd = when.defer()

	console.log('dispatch', message.actionType)

	r.table('editlog')
	.insert({
		id: Date.now() + '' + localSerial++, //process.hrtime()[1],
		name: message.channel,
		log: message
	})
	.run(this._rethinkConnection, function(err, result) {
		if (err)
			return dfd.reject(err)
		
		dfd.resolve(result)
	})

	return dfd.promise
}

EditorChannelServer.prototype.setupCursor = function(channelName, client) {
	var that = this

	r.table('editlog')
	.filter(r.row('name').eq(channelName))
	.changes()
	.run(this._rethinkConnection, function(err, cursor) {
		if (err)
			throw err;

		if (client.cursor)
			client.cursor.close()

		client.cursor = cursor

		cursor.each(function(err, row) {
			if (err)
				throw err;

			var log = row.new_val.log

			console.log('CURSOR', log.actionType, row.new_val.id)

			if (log.from !== client.id)
				that.send(client, log)
		})
	})
	
	r.table('editlog')
	.filter(r.row('name').eq(channelName))
	.orderBy('id')
	.run(this._rethinkConnection, function(err, cursor) {
		cursor.each(function(err, row) {
			console.log('row id', row.id)
			that.send(client, row.log)
		})
	})
}

EditorChannelServer.prototype.joinChannel = function(channelName, client) {
	var that = this

	if (this.config.debug)
		console.log('EditorChannelServer Join:', channelName, client.id)

	if (client.channels.indexOf(channelName) !== -1)
		return

	this.setupCursor(channelName, client)

	if (!this.channels[channelName])
		this.channels[channelName] = []

	var members = this.channels[channelName]

	client.channels.push(channelName)

	members.map(function(oc) {
		that.send(client, { channel: channelName, kind: 'join', data: oc.id })
	})

	members.push(client)

	this.sendToChannel(channelName, {
		channel: channelName,
		kind: 'join',
		data: client.id
	})
}

EditorChannelServer.prototype.leaveChannel = function(channelName, client) {
	if (this.config.debug)
		console.log('EditorChannelServer Leave:', channelName, client.id)

	if (!this.channels[channelName] || this.channels[channelName].indexOf(client) === -1)
		return

	this.sendToChannel(channelName, {
		channel: channelName, kind: 'leave', data: client.id
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
	if (client.socket.readyState !== 1) 
		return;

	console.log('OUT', client.id, message.actionType || message.kind)
	client.socket.send(encode(message), onSocketError)
}

exports.EditorChannelServer = EditorChannelServer

