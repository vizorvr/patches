var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/mutest'+testId

global.WebSocket = require('ws')
global.EventEmitter = require('events').EventEmitter
global._ = require('lodash')
var request = require('supertest')
var mongoose = require('mongoose')
var mongo = require('mongodb')
var assert = require('assert')
global.WebSocketChannel = require('../../browser/scripts/wschannel')
var EditorChannel = require('../../browser/scripts/editorChannel')
var session = require('client-sessions')
var secrets = require('../../config/secrets');
global.Flux = require('../../browser/vendor/flux')

const redis = require('redis')

global.window = {
	location: { hostname: 'localhost', port: 8000 }
}

global.ga = function() {}

function rand() {
	return Math.floor(Math.random() * 100000)
}

var app = require('../../app.js')
var agent = request.agent(app)

function redisClient() {
	return redis.createClient({
		host: process.env.REDIS || 'localhost'
	})
}

function createClient(channelName, lastEditSeen) {
	var dispatcher = new Flux.Dispatcher()
	var chan = new EditorChannel(dispatcher)

	var wsUrl = 'ws://localhost:'+window.location.port+'/__editorChannel'

	chan.connect(wsUrl, {
		headers: {
			'Cookie': 'vs070='+session.util.encode({
				cookieName: 'vs070',
				secret: secrets.sessionSecret,
				duration: 4100421,
				activeDuration: 190248
			}, {
				userId: new mongoose.Types.ObjectId('test1234' + (''+Date.now()).substring(8,12))
			})
		}
	})
	.on('ready', function() {
		chan.lastEditSeen = lastEditSeen

		if (channelName)
			chan.join(channelName, channelName)
	})

	chan.dispatcher = dispatcher

	return chan
}


var s1, s2

var numbers = [ 'one', 'two', 'three', 'four', 'five',
	'six', 'seven', 'eight', 'nine', 'ten' ]

function burst() {
	var bn = numbers.slice()
	var interval = setInterval(function() {
		var n = bn.shift()
		if (n) {
			s1.send({
				actionType: 'uiPluginStateChanged',
				number: n,
				ack: 'ack-' + n
			})
		} else {
			clearInterval(interval)
		}
	}, 1)

	s1.on('ack-ten', function() {
		s1.close()
	})
}

describe('Multiuser', function() {
	var db

	before(function(done) {
		global.dataLayer = []

		app.events.on('ready', function() {
			db = new mongo.Db('mutest'+testId, 
				new mongo.Server('localhost', 27017),
				{ safe: true })

			db.open(function() {
				done()
			})
		})
	})

	after(function(done) {
		mongoose.models = {}
		mongoose.modelSchemas = {}
		mongoose.connection.close()
		done()
	})

	beforeEach(function() {
		global.E2 = {
			track: function() {},
			models: {
				user: {
					once: function(){}
				}
			},
			app: {
				growl: function() {}
			},
			core: {
				active_graph: { uid: 'root' }
			}
		}
	})
	afterEach(function() {
		[s1, s2].map(function(s) {
			if (s) {
				s.close()
				s = null
			}
		})
	})

	it('should connect', function(done) {
		s1 = createClient()
		s1.on('ready', function() {
			done()
		})
	})

	it('sends acks', function(done) {
		s1 = createClient('testack.' + Date.now())
		s1.once('youJoined', function() {
			s1.on('ackAbc', function() {
				done()
			})
			s1.send({
				actionType: 'uiPluginStateChanged',
				ack: 'ackAbc'
			})
		})
	})

	it('should notify two users of each others joins', function(done) {
		s1 = createClient('test1')
		s2 = createClient('test1')

		function checkCondition() {
			if (usersSeen.length < 4)
				return;

			assert.ok(usersSeen.indexOf(s1.uid) > -1)
			assert.ok(usersSeen.indexOf(s2.uid) > -1)

			done()
		}

		var usersSeen = []
		s1.on('join', function(other) {
			usersSeen.push(other.id)
			checkCondition()
		})

		s2.on('join', function(other) {
			usersSeen.push(other.id)
			checkCondition()
		})
	})

	it('sends existing edit log on join', function(done) {
		var channel = 'test2'+Math.random()
		var edits = []
		
		s1 = createClient(channel)
		s1.once('join', burst)
		s1.once('disconnected', function() {
			s2 = createClient(channel)
			s2.dispatcher.register(function(m) {
				if (!m.actionType)
					return;

				edits.push(m)

				if (edits.length === 10) {
					assert.deepEqual(edits.map(function(e) { return e.number }), 
						numbers)

					done()
				}
			})
		})
	})


	it('keeps order of live entries', function(done) {
		var channel = 'test3'+Math.random()
		var edits = []

		s1 = createClient(channel)
		s1.once('join', function() {
			s2 = createClient(channel)
			s2.once('join', burst)
			s2.dispatcher.register(function(m) {
				if (!m.actionType)
					return;

				edits.push(m)

				if (edits.length === 10) {
					assert.deepEqual(edits.map(function(e) { return e.number }), 
						numbers)

					done()
				}
			})
		})

	})


	it('keeps order of replayed entries', function(done) {
		var channel = 'test3'+Math.random()
		var edits = []
		
		s1 = createClient(channel)
		s1.once('join', burst)
		s1.once('disconnected', function() {
			s2 = createClient(channel)
			s2.dispatcher.register(function(m) {
				if (!m.actionType)
					return;

				edits.push(m)

				if (edits.length === 10) {
					assert.deepEqual(edits.map(function(e) { return e.number }), 
						numbers)

					done()
				}
			})
		})
	})

	it('sends log on join, leave, join back', function(done) {
		var channel = 'one-'+Math.random()
		var ogChannel = channel
		var closed = false
		
		s1 = createClient(channel)
		s1.once('join', function() {
			s1.send({
				actionType: 'uiPluginStateChanged',
				number: 1,
				ack: 'ack-one'
			})
			s1.on('ack-one', function() {
				s1.close()
			})

			var s3 = createClient(channel)
			s3.once('youJoined', function() {
				// join some other channel
				channel = 'part-two-'+Math.random()

				s3.once('youJoined', function() {
					// join original channel again
					s3.join(ogChannel, ogChannel, function() {
						s3.dispatcher.register(function(m) {
							if (closed)
								return;

							assert.ok(m.number === 1)
							s3.close()
							closed = true
							s3.once('disconnected', done)
						})
					})
				})

				s3.join(channel, channel, function() {})
			})
		})
	})

	it('sends log from where left off', function(done) {
		var channel = 'test'+Math.random()
		
		s2 = createClient(channel)
		s1 = createClient(channel)

		var firstId, lastId

		s2.dispatcher.register(function(m) {
			if (!firstId)
				firstId = m.id

			lastId = m.id

			// wait until last message
			if (m.number !== 2)
				return;

			// use another client to join with a lastEditSeen set
			var s3 = createClient(channel, firstId)
			s3.once('join', function() {
				// assert that we only get number 2
				s3.dispatcher.register(function(m) {
					assert.equal(m.number, 2)
					assert.equal(m.id, 2)
					s3.close()
					s3.once('disconnected', done)
				})
			})

		})

		// send 1 and 2
		s1.once('join', function() {
			[1,2].forEach(function(n) {
				s1.send({
					actionType: 'uiPluginStateChanged',
					number: n
				})
			})
		})
	})


	it('relays messages to user from cluster', function(done) {
		var channel = 'test'+Math.random()
		
		s1 = createClient(channel)
		var rc = redisClient()

		s1.on('youJoined', function(you) {
			s1.on('join', function(m) {
				if (m.id === 'alice')
					done()
			})

			// write to user's channel
			rc.publish(s1.uid, JSON.stringify({
				kind: 'join',
				channel: channel,
				id: 'alice'
			}))
		})
	})



	it('reconnects when user changes', function(done) {
		var listener
		global.E2.models.user = {
			once: function(key, cb) {
				listener = cb
			}
		}

		var channel = 'test'+Math.random()
		s1 = createClient(channel)
		s1.once('ready', function(uid) {
			var preUid = uid
			s1.once('disconnected', function(m) {
				s1.once('ready', function(uid) {
					assert.notEqual(uid, preUid)
					done()
				})
			})

			listener()
		})
	})



})

