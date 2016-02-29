var assert = require('assert')

var SerialNumber = require('../../lib/serialNumber')

var secrets = require('../../config/secrets')
var mongo = require('mongodb')

function rand() {
	return Math.floor(Math.random() * 100000);
}

var testId = rand()

describe('SerialNumber', function() {
	var sn, db

	before(function(done) {
		db = new mongo.Db('sequence'+testId,
			new mongo.Server('localhost', 27017),
			{ safe: true }
		);

		db.open(done)
	})

	beforeEach(function(done) {
		sn = new SerialNumber(db)
		sn.init()
		sn.__reset('test')
			.then(function(v) {
				done()
			})
	})

	after(function() {
		db.dropDatabase()
	})

	it('can get current value', function(done) {
		return sn.get('test')
		.then(function(value) {
			assert.equal(0, value)
			done()
		})
	})

	it('can get next sequence twice', function(done) {
		return sn.next('test')
		.then(function(value) {
			assert.equal(1, value)

			return sn.next('test')
			.then(function(value) {
				assert.equal(2, value)
				done()
			})
		})
	})

	it('can get next sequence and then current value', function(done) {
		return sn.next('test')
		.then(function(value) {
			assert.equal(1, value)

			return sn.get('test')
			.then(function(value) {
				assert.equal(1, value)
				done()
			})
		})
	})
})