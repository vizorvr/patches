var fsPath = require('path')
var secrets = require('../../../config/secrets')
var mongoose = require('mongoose')
var when = require('when')
var User = require('../../../models/user')
var Graph = require('../../../models/graph')

function processUser(username) {
	var dfd = when.defer()
	
	Graph.find({ owner: username, deleted: false})
	.populate('_creator')
	.exec(function(err, graphs) {
		if (err)
			return dfd.reject(err)

		var userStats = {
			views: 0,
			projects: graphs.length
		}

		var creator = graphs[0]._creator

		when.map(graphs, function(graph) {
			userStats.views += graph.views
		})
		.then(function() {
			creator.setStats(userStats)
				.then(dfd.resolve.bind(dfd))
		})
	})

	return dfd.promise
}

// migrate the graphs and presets in the db
exports.execute = function() {
	var dfd = when.defer()

	function done(err) {
		mongoose.disconnect()

		if (err) {
			console.error('ERROR: ', err.stack)
			return dfd.reject(err)
		}

		dfd.resolve()
	}

	mongoose.connect(secrets.db)

	mongoose.connection.on('connected', function() {
		// each owner in db
		Graph.distinct('owner', function(err, users) {
			if (err)
				return done(err)

			return when.map(users, function(username) {
				if (username === 'v')
					return;

				return processUser(username)
			})
			.then(function() {
				done()
			})
			.catch(done)
		})
	})

	mongoose.connection.on('error', done)

	return dfd.promise
}

if (require.main === module)
	exports.execute()
