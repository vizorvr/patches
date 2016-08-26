var EventEmitter = require('events').EventEmitter
var WebSocket = require('ws')
var WebSocketServer = require('ws').Server
var config = require('../config/config.json').server

var mongoose = require('mongoose')
var redis = require('redis')

var User = require('../models/user')

var secrets = require('../config/secrets')
var sessions = require('client-sessions')

var EditLog = require('../models/editLog')
var SerialNumber = require('redis-serial')

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
		userId: this.userId,
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

	this.clusterNodeId = guid()

	this._redisClient = this.createRedisClient()
	this._redisSubscriber = this.createRedisClient()
	this._redisPublisher = this.createRedisClient()

	this._serialNumber = new SerialNumber(this._redisClient) 
}

EditorChannelServer.prototype = Object.create(EventEmitter.prototype)

EditorChannelServer.prototype.createRedisClient = function() {
	return redis.createClient({
		host: process.env.REDIS || 'localhost'
	})
}

EditorChannelServer.prototype.listen = function(httpServer) {
	this.wss = new WebSocketServer( {
		server: httpServer,
		path: '/__editorChannel'
	})

	this.wss.on('connection', this.handleConnection.bind(this))

	this._redisSubscriber.on('message', this.handleRedisMessage.bind(this))

	this.emit('ready')

	console.log('EditorChannelServer ready')
}

EditorChannelServer.prototype.close = function() {
	this.wss.close()
	this.clients = {}
	this.channels = {}

	this._redisClient.end()
	this._redisPublisher.end()
	this._redisSubscriber.end()
}

EditorChannelServer.prototype.handleConnection = function(socket) {
	var that = this
	var req = socket.upgradeReq
	var remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress

	function abortClient(err) {
		console.error('handleConnection.abortClient', err)

		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ error: err.message, stack: err.stack }))
		}

		socket.close()
	}

	function parseCookie() {
		var header = req.headers.cookie

		if (!header)
			return

		var headerMatch = header.match(/(vs070=[^;\s]*)/)

		if (!headerMatch)
			return

		var sessionCookie = headerMatch[1].substring('vs070='.length)

		return sessions.util.decode({
			cookieName: 'vs070',
			cookie: {
				domain: process.env.FQDN,
			},
			secret: secrets.sessionSecret,
			duration: week,
			activeDuration: day
		}, sessionCookie)
	}

	var cookie = parseCookie()

	if (!cookie || !cookie.content)
		return abortClient('No cookie')

	var userId = cookie.content.userId
	if (cookie.content.passport && cookie.content.passport.user)
		userId = cookie.content.passport.user

	function setupClient(user) {
		var client = new EditorConnection(userId)
		client.socket = socket
		client.remoteAddress = remoteAddress
		client.channels = []
		client.username = user.username
		client.lastMessageReceivedAt = 0
		client.floodCounter = 0

		that.clients[client.id] = client

		socket.on('message', that.handleSocketMessage.bind(that, client))
		socket.on('close', that.onSocketClosed.bind(that, client))

		// relay messages to the user from other nodes
		that._redisSubscriber.subscribe(client.id)

		console.log('EditorChannelServer connected', remoteAddress, userId, client.username, client.id)

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

	this._redisSubscriber.unsubscribe(client.id)

	client.channels.map(function(ch) {
		that.leaveChannel(ch, client)
	})

	delete this.clients[client.id]
}

EditorChannelServer.prototype.handleRedisMessage = function(channelName, payload) {
	var that = this

	// direct message to someone here
	if (this.clients[channelName]) {
		return this.sendString(this.clients[channelName], payload)
	}

	var message = JSON.parse(payload)

	if (message.__cnid !== this.clusterNodeId) {
		switch(message.kind) {
			case 'join': // a join on another node
				var members = this.channels[channelName]

				// tell the joiner our member list
				members.map(function(oc) {
					var m = oc.toJson()
					m.kind = 'join'
					m.date = Date.now()
					m.channel = channelName
					that.sendToClientElsewhere(message.id, m)
				})
				break;
		}
	}

	this.channels[channelName].map(function(client) {
		that.sendString(client, payload)
	})
}

EditorChannelServer.prototype.handleSocketMessage = function(client, m) {
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
			this.joinChannel(message.channel, message.readableName, client, message)
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
					return this.sendToChannel(message.channel, message)

				case 'uiUserIdFollowed':
					client.followUid = message.followUid
					var target = this.clients[message.followUid]
					if (target)
						target.followers++
					return this.sendToChannel(message.channel, message)
				case 'uiUserIdUnfollowed':
					client.followUid = null
					var target = this.clients[message.followUid]
					if (target)
						target.followers--
					return this.sendToChannel(message.channel, message)

				case 'uiMouseMoved':
					client.mousePosition = [message.x, message.y]
					return this.sendToChannel(message.channel, message)
	
				case 'uiMouseClicked':
					return this.sendToChannel(message.channel, message)

				case 'uiPluginTransientStateChanged':
					return this.sendToChannel(message.channel, message)

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
				case 'uiSlotValueChanged':
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

	var dsp = that.dispatchQueue.shift()

	if (dsp.channel === 'Global') { // chat
		// limit max message length
		dsp.message.message = dsp.message.message.substring(0, 1000)
	}

	this._serialNumber.next(dsp.channel)
	.then(function(serial) {
		var payload = {
			id: serial,
			from: dsp.from,
			date: Date.now(),
			log: JSON.stringify(dsp.message)
		}

		that._redisClient.zadd(dsp.channel, serial, JSON.stringify(payload), function(err) {
			if (err)
				console.error('REDIS WRITE FAILED', err.stack)

			that.dispatching = false

			if (dsp.ack) {
				that.send(that.clients[dsp.from], {
					kind: 'ack',
					ack: dsp.ack
				})
			}

			var message = dsp.message
			message.id = payload.id
			message.date = payload.date

			that.sendToChannel(dsp.channel, message)

			that.dispatch()
		})
	})
}

EditorChannelServer.prototype.tail = function(channelName, client, options) {
	var that = this

	var lastEditSeen = options.lastEditSeen
	var limit = options.limit

	function onInitialSet(err, initialSet) {
		if (limit)
			initialSet = initialSet.reverse()

		initialSet.map(function(rowData) {
			var row = JSON.parse(rowData)

			if (!limit && lastEditSeen && row.id === lastEditSeen)
				return;

			var message = JSON.parse(row.log)
			message.id = row.id
			message.date = row.date
			that.send(client, message)
		})
	}

	if (limit) {
		this._redisClient.zrevrangebyscore(channelName, 
			'+inf', 
			'0',
			'LIMIT', '0', limit,
			onInitialSet)
	} else {
		this._redisClient.zrangebyscore(channelName, 
			lastEditSeen || '-inf', 
			'+inf',
			onInitialSet)
	}
}

EditorChannelServer.prototype.joinChannel = function(channelName, readableName, client, message) {
	var that = this

	if (this.config.debug)
		console.log('EditorChannelServer Join:', channelName, client.id)

	if (client.channels.indexOf(channelName) !== -1)
		return

	if (!this.channels[channelName]) {
		this._redisSubscriber.subscribe(channelName)
		this.channels[channelName] = []
	}

	var members = this.channels[channelName]

	function doJoinChannel() {
		// start listening to events from db
		that.tail(channelName, client, {
			lastEditSeen: message.lastEditSeen,
			limit: message.limit
		})

		// add it to client's channels
		client.channels.push(channelName)
		client.activeGraphUid = message.activeGraphUid

		// tell joiner of others (on this node)
		members.map(function(oc) {
			var m = oc.toJson()
			m.kind = 'join'
			m.date = Date.now()
			m.channel = channelName
			that.send(client, m)
		})

		members.push(client)

		// tell others of joiner
		var m = client.toJson()
		m.kind = 'join'
		m.date = Date.now()
		m.channel = channelName
		that.sendToChannel(channelName, m)

		that.send(client, { kind: 'youJoined', channel: channelName })
	}

	if (channelName !== 'Global') {
		EditLog.joinOrCreate(channelName, readableName, client.userId)
		.then(doJoinChannel)
	} else {
		doJoinChannel()
	}

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
	})

	this.channels[channelName] = this.channels[channelName].filter(function(cl) {
		return (client.id !== cl.id)
	})

	client.channels = client.channels.filter(function(ch) {
		return (ch !== channelName)
	})
}

EditorChannelServer.prototype.sendToChannel = function(channelName, message) {
	var that = this

	message.__cnid = this.clusterNodeId

	this._redisPublisher.publish(channelName, encode(message))

	this.emit(channelName, message)
}

EditorChannelServer.prototype.sendToClientElsewhere = function(clientId, message) {
	message.__cnid = this.clusterNodeId
	this._redisPublisher.publish(clientId, encode(message))
}

EditorChannelServer.prototype.send = function(client, message) {
	this.sendString(client, encode(message))
}

EditorChannelServer.prototype.sendString = function(client, message) {
	if (!client || client.socket.readyState !== 1) 
		return;

	client.socket.send(message, onSocketError)
}

exports.EditorChannelServer = EditorChannelServer

