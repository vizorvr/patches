global.WebSocket = require('ws')
var request = require('supertest')
var mongoose = require('mongoose')
var mongo = require('mongodb')
var assert = require('assert')
var WebSocketChannel = require('../../browser/scripts/wschannel')
var r = require('rethinkdb')

global.window = {
	location: { hostname: 'localhost', port: 8000 }
}

function rand() {
	return Math.floor(Math.random() * 100000)
}

var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/mutest'+testId
process.env.RETHINKDB_NAME = 'test' + testId

var app = require('../../app.js')
var agent = request.agent(app)

function createClient(channelName) {
	var ws = new WebSocketChannel(agent)

	ws.connect('/__editorChannel')
		.on('ready', function() {
			if (channelName)
				ws.join(channelName)
		})
		.on('*', function(m) {
			ws.emit(m.kind, m)
		})

	return ws
}

var rethinkConnection
function setupDatabase(cb) {
	var dbName = process.env.RETHINKDB_NAME

	r.connect({
		host: 'localhost',
		port: 28015
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
			if (s) s.close()
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
		var usersSeen = []
		s1.on('join', function(other) {
			if (other.data === s1.uid)
				return
			usersSeen.push(other.data)
		})
		s2.on('join', function(other) {
			if (other.data === s2.uid)
				return
			usersSeen.push(other.data)
			assert.ok(usersSeen.length, 2)
			assert.ok(usersSeen.indexOf(s1.uid) > -1)
			assert.ok(usersSeen.indexOf(s2.uid) > -1)
			done()
		})
	})

	it('sends existing edit log on join', function(done) {
		var channel = 'test2'+Math.random()
		var edits = []
		
		s1 = createClient(channel)

		s1.once('join', function() {
			s1.send(channel, { actionType: 'one' })
			s1.send(channel, { actionType: 'two' })
			s1.send(channel, { actionType: 'three' })
			s1.send(channel, { actionType: 'four' })
			s1.send(channel, { actionType: 'five' })
			s1.send(channel, { actionType: 'six' })
			s1.send(channel, { actionType: 'seven' })
			s1.send(channel, { actionType: 'eight' })
			s1.send(channel, { actionType: 'nine' })
			s1.send(channel, { actionType: 'ten' })
			setTimeout(function() {
				s1.close()
			}, 500)
		})

		s1.on('disconnected', function() {
			s2 = createClient(channel)

			s2.on(channel, function(m) {
				if (m.kind === 'join')
					return;

				edits.push(m)

				if (edits.length === 10) {
					assert.deepEqual(edits.map(function(e) { return e.actionType }), 
						[ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ])

					done()
				}
			})
		})
	})


	it('keeps order of live entries', function(done) {
		var channel = 'test3'+Math.random()
		var edits = []
		
		s1 = createClient(channel)

		function burst() {
			s1.send(channel, { actionType: 'one' })
			s1.send(channel, { actionType: 'two' })
			s1.send(channel, { actionType: 'three' })
			s1.send(channel, { actionType: 'four' })
			s1.send(channel, { actionType: 'five' })
			s1.send(channel, { actionType: 'six' })
			s1.send(channel, { actionType: 'seven' })
			s1.send(channel, { actionType: 'eight' })
			s1.send(channel, { actionType: 'nine' })
			s1.send(channel, { actionType: 'ten' })
		}

		s1.once('join', function() {
			s2 = createClient(channel)

			s2.once('join', burst)

			s2.on(channel, function(m) {
				if (m.kind === 'join')
					return;

				edits.push(m)

				if (edits.length === 10) {
					assert.deepEqual(edits.map(function(e) { return e.actionType }), 
						[ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ])

					done()
				}
			})
		})

	})

	// it('can make snapshots of the edit log', function(done) {
		// s1 = createClient('test1')
	// })


})

