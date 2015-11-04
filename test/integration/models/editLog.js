var assert = require('assert')
var EditLog = require('../../../models/editLog.js')
var mongoose = require('mongoose')
var mongo = require('mongodb')
var ObjectId = require('mongoose').Types.ObjectId; 

var testId = rand()

process.env.MONGODB = 'mongodb://localhost:27017/eltest'+testId

function rand() {
	return Math.floor(Math.random() * 100000)
}

describe('EditLog', function() {
	var db

	before(function(done) {
		mongoose.connect(process.env.MONGODB)

		db = new mongo.Db('eltest'+testId, 
			new mongo.Server('localhost', 27017),
			{ safe: true })

		db.open(function() {
			done()
		})
	})

	after(function(done) {
		db.dropDatabase()
		db.close()
		mongoose.models = {}
		mongoose.modelSchemas = {}
		mongoose.connection.close()
		done()
	})

	it('can find editlogs by channel name', function(done) {
		new EditLog({
			owner: 'testi',
			name: 'chan1',
			readableName: 'my channel'
		})
		.save(function(err) {
			if (err) return done(err)
			
			EditLog.findOne({ name: 'chan1'})
			.exec(function(err, el) {
				if (err) return done(err)

				assert.equal(el.readableName, 'my channel')
				done()
			})
		})
	})

	it('can find editlogs by participant', function(done) {
		new EditLog({
			owner: 'testi',
			name: 'chan'+rand(),
			readableName: 'my channel'
		})
		.save(function(err, savedEl) {
			if (err) return done(err)
			
			var participant = 'aaaaaaaaaaaa'

			savedEl.addParticipant(participant)
			.then(function() {
				EditLog.findOne({ participants: participant })
				.exec(function(err, el) {
					if (err) return done(err)
					assert.equal(el.readableName, 'my channel')
					done()
				})
			})
		})
	})

	it('does not add participant twice', function(done) {
		new EditLog({
			owner: 'testi',
			name: 'chan'+rand(),
			readableName: 'my channel'
		})
		.save(function(err, savedEl) {
			if (err) return done(err)
			
			var participant = 'abcdabcd1234'

			savedEl.addParticipant(participant)
			.then(function() {
				return savedEl.addParticipant(participant)
			})
			.then(function() {
				EditLog.findOne({ participants: participant })
				.exec(function(err, el) {
					if (err) return done(err)
					assert.equal(el.readableName, 'my channel')
					assert.equal(el.participants.length, 1)
					done()
				})
			})
		})
	})


})

