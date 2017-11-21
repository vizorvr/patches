var testId = rand()
process.env.MONGODB = 'mongodb://localhost:27017/serial'+testId

var secrets = require('../../config/secrets')
var Serial = require('../../models/serial')
var assert = require('assert')
var mongoose = require('mongoose')
mongoose.Promise = global.Promise

function rand() {
	return Math.floor(Math.random() * 100000)
}

describe('EditLog', function() {
	var connection

	before(function(done) {
		mongoose.connect(secrets.db)
		mongoose.connection.on('error', done)
		mongoose.connection.on('connected', c => {
			connection = mongoose.connection
			done()
		})
	})

	after(function() {
		connection.db.dropDatabase()
		connection.close()
	})

	it('should create serials', function(done) {
		Serial.next('test-first-'+testId)
		.then(function(serial) {
			assert.equal(100001, serial)
			done()
		})
		.catch(done)
	})

	it('should increase serials', function(done) {
		Serial.next('test-increase-'+testId)
		.then(function(serial) {
			return Serial.next('test-increase-'+testId)
			.then(function(serial) {
				assert.equal(100002, serial)
				done()
			})
		})
		.catch(done)
	})

})

