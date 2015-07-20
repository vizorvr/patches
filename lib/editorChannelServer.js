var EventEmitter = require('events').EventEmitter
var WebSocketServer = require('ws').Server
var config = require('../config/config.json').server
var crypto = require('crypto')
var r = require('rethinkdb')
var when = require('when')

var mongoose = require('mongoose')

var User = require('../models/user')

var secrets = require('../config/secrets')
var sessions = require('client-sessions')

var minute = 60 * 1000;
var hour = 60 * minute;
var day = hour * 24;
var week = day * 7;

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

function EditorConnection(userId) {
	this.color = '#' + Math.floor(Math.random() * 16777215).toString(16)
	this.id = crypto.randomBytes(20).toString('hex')
	this.userId = userId
	this.followers = 0
}
EditorConnection.prototype.toJson = function() {
	var json = {
		channel: this.channelName,
		color: this.color,
		id: this.id,
		username: this.username,
		activeGraphUid: this.activeGraphUid,
		followers: this.followers
	}
	return json
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
	var header = socket.upgradeReq.headers.cookie

	var sessionCookie = header
		.match(/(session=[^;\s]*)/)[1]
		.substring('session='.length)

	var cookie = sessions.util.decode({
		cookieName: 'session',
		secret: secrets.sessionSecret,
		duration: week,
		activeDuration: day
	}, sessionCookie)

	if (!cookie || !cookie.content)
		return abortClient({})

	var userId = cookie.content.userId

	function abortClient(err) {
		console.error(err.stack)
		socket.send(JSON.stringify({ error: err.message, stack: err.stack }))
		socket.close()
	}

	function setupClient(user) {
		var client = new EditorConnection(userId)
		client.socket = socket
		client.channels = []
		client.username = user.username

		that.clients[client.id] = client

		socket.on('message', that.handleMessage.bind(that, client))
		socket.on('close', that.onSocketClosed.bind(that, client))

		that.send(client, {
			kind: 'READY',
			id: client.id,
			color: client.color
		})
	}

	User.findById(mongoose.Types.ObjectId(userId), function(err, user) {
		if (err)
			return abortClient(err)

		if (!user)
			return setupClient({ username: userId.substring(0,5) })
		
		setupClient(user)
	})
}

EditorChannelServer.prototype.onSocketClosed = function(client) {
	var that = this

	client.channels.map(function(ch) {
		that.leaveChannel(ch, client)
	})

	delete this.clients[client.id]
}

EditorChannelServer.prototype.handleMessage = function(client, m) {
	var message = JSON.parse(m)
	message.from = client.id

	if (!message.channel)
		return

	switch(message.kind) {
		case 'join':
			this.joinChannel(message.channel, client, message)
			break

		case 'leave':
			if (this.clients[client.followUid])
				this.clients[client.followUid].followers--

			this.leaveChannel(message.channel, client)
			break

		default:
			if (!message.actionType)
				return;

			switch(message.actionType) {
				case 'uiActiveGraphChanged':
					client.activeGraphUid = message.activeGraphUid
					return this.sendToChannel(message.channel, message, message.from)

				case 'uiUserIdFollowed':
					client.followUid = message.followUid
					var target = this.clients[message.followUid]
					if (target)
						target.followers++
					return this.sendToChannel(message.channel, message, message.from)
				case 'uiUserIdUnfollowed':
					client.followUid = null
					var target = this.clients[message.followUid]
					if (target)
						target.followers--
					return this.sendToChannel(message.channel, message, message.from)

				case 'uiMouseMoved':
					client.mousePosition = [message.x, message.y]
					return this.sendToChannel(message.channel, message, message.from)
				case 'uiMouseClicked':
					return this.sendToChannel(message.channel, message, message.from)

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
					this.queue({
						channel: message.channel,
						from: client.id,
						message: message
					})

					this.dispatch()
					break;
				default:
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

	if (!that._rethinkConnection)
		return;

	r.table('editlog')
	.filter(r.row('name').eq(channelName))
	.orderBy('id')
	.run(that._rethinkConnection, function(err, cursor) {
		if (err)
			return clientErrorReporter.bind(this, client, err)

		cursor.each(function(err, row) {
			var message = JSON.parse(row.log)
			message.id = row.id
			that.send(client, message)
		})
	})

	r.table('editlog')
	.filter(r.row('name').eq(channelName))
	.changes()
	.run(this._rethinkConnection, function(err, cursor) {
		if (err)
			return clientErrorReporter.bind(this, client, err)
		
		if (client.cursor)
			client.cursor.close()

		client.cursor = cursor

		cursor.each(function(err, dsp) {
			if (err)
				return clientErrorReporter.bind(this, client, err)

			var log = dsp.new_val.log

			if (dsp.new_val.from !== client.id) {
				var message = JSON.parse(log)
				message.id = dsp.new_val.id
				that.send(client, message)
			}
		})
	})
}

EditorChannelServer.prototype.joinChannel = function(channelName, client, message) {
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
	client.activeGraphUid = message.activeGraphUid

	members.map(function(oc) {
		var m = oc.toJson()
		m.kind = 'join'
		m.channel = channelName
		that.send(client, m)
	})

	members.push(client)

	var m = client.toJson()
	m.kind = 'join'
	this.sendToChannel(channelName, m)

	this.send(client, { kind: 'youJoined', channel: channelName })
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

		console.log('send: client', client.id, message.actionType || message.kind)

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

