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

global.window = {
	location: { hostname: 'localhost', port: 8000 }
}

global.ga = function(){}

function rand() {
	return Math.floor(Math.random() * 100000)
}

var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/mutest'+testId
process.env.RETHINKDB_NAME = 'test' + testId

var app = require('../../app.js')
var agent = request.agent(app)

function createClient(channelName, lastEditSeen) {
	var dispatcher = new Flux.Dispatcher()
	var chan = new EditorChannel(dispatcher)

	chan.connect({
		headers: {
			'Cookie': 'session='+session.util.encode({
				cookieName: 'session',
				secret: secrets.sessionSecret,
				duration: 4100421,
				activeDuration: 190248
			}, {
				userId: 'test1234' + Date.now() % 10000
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
function setupDatabase(cb) {
	var dbName = process.env.RETHINKDB_NAME

	r.connect({
		host: 'localhost',
		port: 28015,
		db: dbName
	}, function(err, conn) {
		if (err)
			throw err;

		rethinkConnection = conn
		cb()
	})
} 

describe('Multiuser', function() {
	var db
	var s1, s2

	before(function(done) {
		global.E2 = {
			app: {
				growl: function() {}
			},
			core: {
				active_graph: { uid: 'root' }
			}
		}

		app._editorChannel.on('ready', function() {
			setupDatabase(function(err) {
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
		.on('READY', function() {
			done()
		})
	})

	it('should notify two users of each others joins', function(done) {
		s1 = createClient('test1')
		s2 = createClient('test1')

		function checkCondition() {
			console.log('checkCondition', usersSeen.length)
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
		var numbers = [ 'one', 'two', 'three', 'four', 'five',
			'six', 'seven', 'eight', 'nine', 'ten' ]

		s1.once('join', function() {
			numbers.map(function(n) {
				s1.send({
					actionType: 'uiPluginStateChanged',
					number: n
				})
			})
			s1.close()
		})

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
		
		var numbers = [ 'one', 'two', 'three', 'four', 'five',
			'six', 'seven', 'eight', 'nine', 'ten' ]

		function burst() {
			numbers.map(function(n) {
				s1.send({
					actionType: 'uiPluginStateChanged',
					number: n
				})
			})
		}

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


	it('sends log on join, leave, join back', function(done) {
		var channel = 'one-'+Math.random()
		var ogChannel = channel
		
		s1 = createClient(channel)

		s1.once('join', function() {
			console.log('s1 id', s1.uid)
			s1.send({
				actionType: 'uiPluginStateChanged',
				number: 1
			})

			var s3 = createClient(channel)
			s3.once('join', function() {
				// join some other channel
				channel = 'part-two-'+Math.random()
				s3.join(channel, function() {
					// join original channel again
					s3.join(ogChannel, function() {
						s3.dispatcher.register(function(m) {
							assert.ok(m.number === 1)
							s3.close()
							done()
						})
					})
				})
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
					done()
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

