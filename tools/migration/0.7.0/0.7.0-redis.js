var fsPath = require('path')
var secrets = require('../../../config/secrets')
var r = require('rethinkdb')
var redis = require('redis')
var when = require('when')

function connect() {
	var dfd = when.defer()

	r.connect({
		host: process.env.RETHINKDB_HOST || 'localhost',
		port: 28015,
		db: 'vizor'
	}, function(err, conn) {
		if (err)
			dfd.reject(err)
		dfd.resolve(conn)
	})

	return dfd.promise
}

exports.execute = function() {
	var dfd = when.defer()
	var rethinkConnection
	var redisClient = redis.createClient({
		host: process.env.REDIS || 'localhost'
	})

	function done(err) {
		rethinkConnection.close()
		redisClient.end()

		if (err) {
			console.error('ERROR: ', err.stack)
			return dfd.reject(err)
		}

		dfd.resolve()
	}

	connect()
	.then(function(c) {
		rethinkConnection = c
		r.table('editlog')
		.run(rethinkConnection, function(err, cursor) {
			if (err)
				return done(err)

			cursor.toArray(function(err, logItems) {
				when.map(logItems, function(row) {
					var mapDfd = when.defer()
					console.log(row.name, row.id)
					redisClient.zadd(row.name, row.id, JSON.stringify(row), function(err) {
						if (err)
							return mapDfd.reject(err)
						mapDfd.resolve()
						return 
					})
					return mapDfd.promise
				})
				.then(function() {
					done()
				})
			})
		})
	})

	return dfd.promise
}

if (require.main === module)
	exports.execute()
