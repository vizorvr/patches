var fsPath = require('path')
var secrets = require('../../../config/secrets')
var r = require('rethinkdb')
var redis = require('redis')
var mongoose = require('mongoose')
var when = require('when')
var SerialNumber = require('../../../lib/serialNumber')

var mongoDb, mongoColl, rethinkConnection
var redisClient
var sn

function connect() {
	var dfd = when.defer()

	mongoose.connect(secrets.db)

	mongoose.connection.on('connected', function() {
		mongoDb = mongoose.connection.db
		mongoDb.collection('counters', function(err, coll) {
			if (err) return dfd.reject(err)
			mongoColl = coll

			r.connect({
				host: process.env.RETHINKDB_HOST || 'localhost',
				port: 28015,
				db: 'vizor'
			}, function(err, conn) {
				if (err)
					dfd.reject(err)

				rethinkConnection = conn
		
				redisClient = redis.createClient({
					host: process.env.REDIS || 'localhost'
				})

				redisClient.on('connect', function() {
					sn = new SerialNumber(redisClient)
					dfd.resolve()
				})
			})
		})
	})

	return dfd.promise
}

function migrateSerials() {
	var dfd = when.defer()
	mongoColl.find({}, function(err, counters) {
		counters.each(function(err, counter) {
			if (err) return dfd.reject(err)
			if (!counter) return dfd.resolve()
			console.log('   Set', counter._id, 'to', counter.seq)
			sn.set(counter._id, counter.seq)
		})
	})
	return dfd.promise
}

exports.execute = function() {
	var total
	var dfd = when.defer()

	function done(err) {
		mongoose.connection.close()
		rethinkConnection.close()
		redisClient.end()

		console.log('All done')

		if (err) {
			console.error('ERROR: ', err.stack)
			return dfd.reject(err)
		}

		dfd.resolve()
	}

	connect()
	.then(function() {
		console.log('Migrating serials')
		return migrateSerials()
	})
	.then(function() {
		console.log('Indexing')
		return r.table('editlog')
		.indexCreate('name')
		.run(rethinkConnection)
		.error(function() {})
	})
	.then(function() {
		return r.table('editlog')
		.indexWait('name')
		.run(rethinkConnection)
	})
	.then(function() {
		console.log('Counting')
		return r.table('editlog').count()
		.run(rethinkConnection)
	})
	.then(function(t) {
		total = t

		return r.table('editlog')
		.orderBy({ index: 'name' })
		.run(rethinkConnection)
	})
	.then(function(cursor) {
		var i=0

		return cursor.eachAsync(function(row) {
			var idfd = when.defer()
			sn.next('serial:'+row.name)
			.then(function(serial) {
				if (++i % 1000 === 0) {
					console.log('    ', i, 'of', total, '-',
						Math.round((i/total) * 100) + '%')
				}

				var payload = {
					id: serial,
					from: row.from,
					date: row.date,
					log: row.log
				}

				redisClient.zadd(row.name, serial, JSON.stringify(payload), function(err) {
					if (err) return idfd.reject(err)
					idfd.resolve()
				})
			})

			return idfd.promise
		})
	})
	.then(function() {
		done()
	})
	.catch(done)

	return dfd.promise
}

if (require.main === module)
	exports.execute()
