var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/mutest'+testId
process.env.RETHINKDB_NAME = 'test' + testId

global.WebSocket = require('ws')
global.EventEmitter = require('events').EventEmitter
global._ = require('lodash')
var request = require('supertest')
var mongoose = require('mongoose')
var mongo = require('mongodb')
var assert = require('assert')
global.WebSocketChannel = require('../../browser/scripts/wschannel')
var EditorChannel = require('../../browser/scripts/editorChannel')
var r = require('rethinkdb')
var session = require('client-sessions')
var secrets = require('../../config/secrets');
global.Flux = require('../../browser/vendor/flux')

var setupRethinkDatabase = require('../../tools/setup').setupRethinkDatabase

global.window = {
	location: { hostname: 'localhost', port: 8000 }
}

global.ga = function(){}

function rand() {
	return Math.floor(Math.random() * 100000)
}

var app = require('../../app.js')
var agent = request.agent(app)

function createClient(channelName, lastEditSeen) {
	var dispatcher = new Flux.Dispatcher()
	var chan = new EditorChannel(dispatcher)

	chan.connect({
		headers: {
			'Cookie': 'vs050='+session.util.encode({
				cookieName: 'vs050',
				secret: secrets.sessionSecret,
				duration: 4100421,
				activeDuration: 190248
			}, {
				userId: 'test1234' + (''+Date.now()).substring(8,12)
			})
		}
	})
	.on('ready', function() {
		chan.lastEditSeen = lastEditSeen

		if (channelName)
			chan.join(channelName)
	})

	chan.dispatcher = dispatcher

	return chan
}

var rethinkConnection
function setupDatabase() {
	var dbName = process.env.RETHINKDB_NAME

	return r.connect({
		host: 'localhost',
		port: 28015,
		db: dbName
	})
	.then(function(conn) {
		rethinkConnection = conn
		return setupRethinkDatabase()
	})
	.error(function(err) {
		throw err
	})
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
		global.E2 = {
			app: {
				growl: function() {}
			},
			core: {
				active_graph: { uid: 'root' }
			}
		}

		app.events.on('ready', function() {
			setupDatabase()
			.then(function() {
				db = new mongo.Db('mutest'+testId, 
					new mongo.Server('localhost', 27017),
					{ safe: true })

				db.open(function() {
					done()
				})
			})
		})
	})

	after(function(done) {
		mongoose.models = {}
		mongoose.modelSchemas = {}
		mongoose.connection.close()

		r.dbDrop(process.env.RETHINKDB_NAME)
			.run(rethinkConnection, function() {
				db.dropDatabase()
				db.close()
				rethinkConnection.close()
				done()
			})
	})

	beforeEach(function() {})
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
		s1 = createClient('testack')
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
		s1.on('disconnected', function() {
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
					s3.join(ogChannel, function() {
						s3.dispatcher.register(function(m) {
							assert.ok(m.number === 1)
							s3.close()
							s3.on('disconnected', done)
						})
					})
				})

				s3.join(channel, function() {})
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
					assert.notEqual(m.number, 1)
					assert.equal(m.id, lastId)
					s3.close()
					s3.on('disconnected', done)
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



})

