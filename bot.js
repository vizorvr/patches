
const channelName = 'editor-chat-dev'
const SlackBot = require('slackbots')
const redis = require('redis')
const SerialNumber = require('./lib/serialNumber')

function createRedisClient() {
	return redis.createClient({
		host: process.env.REDIS || 'localhost'
	})
}

function VizorSlackBot() {
	var that = this

	this._redisClient = createRedisClient()
	this._redisPublisher = createRedisClient()
	this._redisSubscriber = createRedisClient()

	// relay messages on Global chat
	this._redisSubscriber.subscribe('Global')
	this._redisSubscriber.on('message', function(_ch, payload) {
		var message = JSON.parse(payload)
		if (message.from === 'server')
			return;
		that.postToSlack(message.username+': '+message.message)
	})

	this._serialNumber = new SerialNumber(this._redisClient)

	this._bot = new SlackBot({
		token: process.env.SLACKBOT_TOKEN,
		name: 'Vizor'
	})
	
	this._bot.once('start', function() {
		var userMap = {}

		that._bot.getUsers().then(function(users) {
			users.members.forEach(function(user) {
				userMap[user.id] = user.name
			})
		})

		that._bot.on('message', function(data) {
			switch(data.type) {
				case 'message':
					if (data.bot_id)
						return;

					console.log('IN:', userMap[data.user], data.text)

					that.postToVizor(userMap[data.user], data.text)
					break;

				case 'hello':
					that.postToSlack('Hi everyone, I\'m back!')
					break;

				default:
					if (data.type === 'user_typing')
						return;

					console.log('INFO', userMap[data.user], data.type)

					break;
			}
		})
	})
}

VizorSlackBot.prototype.close = function(err) {
	if (err)
		console.error(err)

	this._bot.ws.close()
	this._redisClient.end()
	this._redisSubscriber.end()
	this._redisPublisher.end()
}

VizorSlackBot.prototype.postToVizor = function(asUserName, text) {
	var that = this

	var channel = 'Global'
	var action = {
		actionType: 'uiChatMessageAdded',
		channel: channel,
		from: 'server',
		username: asUserName,
		message: text
	}

	this._serialNumber.next(channel)
	.then(function(serial) {
		var payload = {
			id: serial,
			date: Date.now(),
			log: JSON.stringify(action)
		}

		that._redisPublisher.zadd(channel, serial, JSON.stringify(payload), function(err) {
			if (err)
				console.error('REDIS WRITE FAILED', err.stack)
		
			var message = action
			message.id = payload.id
			message.date = payload.date

			that._redisPublisher.publish(channel, JSON.stringify(message))
		})
	})
}

VizorSlackBot.prototype.postToSlack = function(text) {
	console.log('OUT:', text)

	return this._bot.postTo(channelName, text)
		.fail(this.close.bind(this))
}

var bot = new VizorSlackBot()

