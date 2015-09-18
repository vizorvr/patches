var EventEmitter = require('events').EventEmitter
var WebSocketServer = require('ws').Server
var config = require('../config/config.json').server
var r = require('rethinkdb')

var mongoose = require('mongoose')

var User = require('../models/user')

var secrets = require('../config/secrets')
var sessions = require('client-sessions')

var minute = 60 * 1000;
var hour = 60 * minute;
var day = hour * 24;
var week = day * 7;

function guid() {
	var alf = 'abcdefghijklmnopqrstuvwxyz0123456789'
	var gstr = ''
	for (var i=0; i < 10; i++) {
		gstr += alf[Math.floor(Math.random() * alf.length)]
	}
	return gstr
}

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
	this.id = guid()
	console.log('EditorConnection id', this.id)
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

function EditorChannelServer(rethinkConnection) {
	EventEmitter.call(this)
	this.config = config
	this.clients = {}
	this.channels = {}
	this.dispatchQueue = []

	this._rethinkConnection = rethinkConnection
}

EditorChannelServer.prototype = Object.create(EventEmitter.prototype)

EditorChannelServer.prototype.listen = function(httpServer) {
	var that = this

	that.wss = new WebSocketServer( {
		server: httpServer,
		path: '/__editorChannel'
	})

	that.wss.on('connection', that.handleConnection.bind(that))

	that.emit('ready')

	console.log('EditorChannelServer ready')
}

EditorChannelServer.prototype.close = function() {
	this.wss.close()
	this.clients = {}
	this.channels = {}
	this._rethinkConnection.close()
}

EditorChannelServer.prototype.handleConnection = function(socket) {
	var that = this
	var req = socket.upgradeReq
	var remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress

	console.log('EditorChannelServer Connection',
		req.headers.host,
		'cookie',
		!!req.headers.cookie,
		'remote',
		remoteAddress)

	function abortClient(err) {
		console.error('handleConnection.abortClient', err)
		socket.send(JSON.stringify({ error: err.message, stack: err.stack }))
		socket.close()
	}

	function parseCookie() {
		var header = req.headers.cookie

		if (!header)
			return abortClient('No session cookie found')

		var headerMatch = header.match(/(session=[^;\s]*)/)

		if (!headerMatch)
			return abortClient('No session cookie found')

		var sessionCookie = headerMatch[1].substring('session='.length)

		cookie = sessions.util.decode({
			cookieName: 'session',
			secret: secrets.sessionSecret,
			duration: week,
			activeDuration: day
		}, sessionCookie)

		return cookie
	}

	var cookie = parseCookie()

	if (!cookie || !cookie.content)
		return abortClient('No cookie')

	var userId = cookie.content.userId

	function setupClient(user) {
		var client = new EditorConnection(userId)
		client.socket = socket
		client.remoteAddress = remoteAddress
		client.channels = []
		client.username = user.username
		client.lastMessageReceivedAt = 0
		client.floodCounter = 0

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
			return abortClient(err.stack)

		if (!user)
			return setupClient({
				username: 'Guest '+
					userId.substring(0, 1).toUpperCase() +
					userId.substring(1, 2)
			})
		
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
	var now = Date.now()

	var message = JSON.parse(m)
	message.from = client.id

	if (message.actionType === 'uiChatMessageAdded') {
		message.username = client.username
		message.color = client.color

		if (now - client.lastMessageReceivedAt < 3000) {
			client.floodCounter++
		}
		else
			client.floodCounter = 0

		if (client.floodCounter > 5) {
			console.log('kicking client',
				client.id,
				client.remoteAddress,
				client.floodCounter)

			this.send(client, {
				kind: 'kicked',
				from: 'server',
				channel: 'server',
				reason: 'You are sending too many messages too quickly'
			})

			return client.socket.close()
		}

	}

	client.lastMessageReceivedAt = now

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

				case 'uiChatMessageAdded':
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
					this.queue({
						channel: message.channel,
						from: client.id,
						ack: message.ack,
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
		createdAt: Date.now(),
		name: dsp.channel,
		from: dsp.from,
		date: Date.now(),
		log: JSON.stringify(dsp.message)
	})
	.run(this._rethinkConnection, {durability: 'hard'}, function(err, result) {
		if (err)
			console.error(err.stack)

		that.dispatching = false

		if (dsp.ack) {
			that.send(that.clients[dsp.from], {
				kind: 'ack',
				ack: dsp.ack
			})
		}

		that.dispatch()
	})
}

EditorChannelServer.prototype.tail = function(channelName, client, options) {
	var that = this

	var lastEditSeen = options.lastEditSeen
	var limit = options.limit

	if (!that._rethinkConnection)
		return;

	var cmd = r.table('editlog')

	if (lastEditSeen) {
		cmd = cmd.filter(r.row('name').eq(channelName)
			.and(r.row('id').gt(lastEditSeen)))
	} else {
		cmd = cmd.filter(r.row('name').eq(channelName))
	}

	cmd = cmd.orderBy('id')

	if (limit)
		cmd = cmd.orderBy(r.desc('id')).limit(limit)

	cmd.run(that._rethinkConnection, function(err, cursor) {
		if (err)
			return clientErrorReporter.bind(this, client, err)

		cursor.toArray(function(err, initialSet) {
			if (limit)
				initialSet = initialSet.reverse()

			initialSet.map(function(row) {
				var message = JSON.parse(row.log)
				message.id = row.id
				message.date = row.date
				that.send(client, message)
			})
		})
	})

	cmd = r.table('editlog')
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

			var message = JSON.parse(log)
			message.id = dsp.new_val.id
			that.send(client, message)
		})
	})
}

EditorChannelServer.prototype.joinChannel = function(channelName, client, message) {
	var that = this

	if (this.config.debug)
		console.log('EditorChannelServer Join:', channelName, client.id)

	if (client.channels.indexOf(channelName) !== -1)
		return

	if (!this.channels[channelName])
		this.channels[channelName] = []

	var members = this.channels[channelName]

	// start listening to events from db
	this.tail(channelName, client, {
		lastEditSeen: message.lastEditSeen,
		limit: message.limit
	})

	// add it to client's channels
	client.channels.push(channelName)
	client.activeGraphUid = message.activeGraphUid

	// tell others of joiner
	members.map(function(oc) {
		var m = oc.toJson()
		m.kind = 'join'
		m.date = Date.now()
		m.channel = channelName
		that.send(client, m)
	})

	members.push(client)

	// tell joiner of others
	var m = client.toJson()
	m.kind = 'join'
	m.channel = channelName
	this.sendToChannel(channelName, m)

	this.send(client, { kind: 'youJoined', channel: channelName })
}

EditorChannelServer.prototype.leaveChannel = function(channelName, client) {
	if (this.config.debug)
		console.log('EditorChannelServer Leave:', channelName, client.id)

	if (!this.channels[channelName] || this.channels[channelName].indexOf(client) === -1)
		return

	this.sendToChannel(channelName, {
		channel: channelName,
		kind: 'leave',
		date: Date.now(),
		username: client.username,
		id: client.id
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

		that.send(client, message)
	})

	this.emit(channelName, message)
}

EditorChannelServer.prototype.send = function(client, message) {
	// console.log('send', message.actionType || message.kind, message.channel)
	this.sendString(client, encode(message))
}

EditorChannelServer.prototype.sendString = function(client, message) {
	if (!client || client.socket.readyState !== 1) 
		return;

	client.socket.send(message, onSocketError)
}

exports.EditorChannelServer = EditorChannelServer

