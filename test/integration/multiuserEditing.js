global.WebSocket = require('ws')
var request = require('supertest')
var mongoose = require('mongoose')
var mongo = require('mongodb')
var assert = require('assert')
var WebSocketChannel = require('../../browser/scripts/wschannel')

require('../../models/editLog')

global.window = {
	location: { hostname: 'localhost', port: 8000 }
}

function rand() {
	return Math.floor(Math.random() * 100000)
}

var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/mutest'+testId

var app = require('../../app.js')
var agent = request.agent(app)

function createClient(channelName) {
	var ws = new WebSocketChannel(agent)

	ws  .connect('/__editorChannel')
		.on('ready', function() {
			if (channelName) 
				ws.join(channelName)
		})
		.on('*', function(m) {
			ws.emit(m.kind, m)
		})

	return ws
}

describe('Multiuser', function() {
	var db
	var s1, s2 

	before(function(done) {
		db = new mongo.Db('test'+testId,
			new mongo.Server('localhost', 27017),
			{ safe: true }
		)

		db.open(function() {
			done()
		})

	})

	after(function() {
		mongoose.models = {}
		mongoose.modelSchemas = {}
		mongoose.connection.close()
		db.dropDatabase()
		db.close()
	})

	beforeEach(function() {})
	afterEach(function() {
		[s1, s2].map(function(s) {
			if (s) s.close()
		})
	})

	it('should connect', function(done) {
		var c = createClient()
		.on('READY', function() {
			c.close()
			done()
		})
	})

	it('should notify two users of each others joins', function(done) {
		s1 = createClient('test1')
		s2 = createClient('test1')
		var usersSeen = []
		s1.on('join', function(other) {
			usersSeen.push(other.data)
		})
		s2.on('join', function(other) {
			usersSeen.push(other.data)
			assert.deepEqual(usersSeen, [ s2.uid, s1.uid ])
			done()
		})
	})

	it('sends existing edit log on join', function(done) {
		var channel = 'test2'+Math.random()
		var edits = []
		
		s1 = createClient(channel)

		s1.once('READY', function() {
			s1.send(channel, { actionType: 'foo' })
			s1.send(channel, { actionType: 'bar' })
			s1.send(channel, { actionType: 'baz' })
			s1.close()
		})

		s1.on('disconnected', function() {
			s2 = createClient(channel)

			s2.on(channel, function(m) {
				if (m.kind === 'join')
					return;

				edits.push(m)

				if (edits.length === 3) {
					assert.deepEqual(edits.map(function(e) { return e.actionType }), 
						[ 'foo', 'bar', 'baz' ])

					done()
				}
			})
		})
	})

	// it('can make snapshots of the edit log', function(done) {
		// s1 = createClient('test1')
	// })


})

