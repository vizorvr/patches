var fsPath = require('path')
var secrets = require('../../../config/secrets')
var mongoose = require('mongoose')
var when = require('when')
var Graph = require('../../../models/graph')
var Preset = require('../../../models/preset')

var migrateGraph = require('./migrate').migrateGraph

var GridFsStorage = require('../../../lib/gridfs-storage')
var gfs = new GridFsStorage('/data')

function processGraphs(graphs) {
	var totalGraphs = graphs.length 

	return when.map(graphs, function(gm) {
		var gfsPath = gm.url.replace(/^\/data/, '')
		var basename = fsPath.basename(gfsPath)

		console.log('  - ', basename)

		return gfs.readString(gfsPath)
		.then(function(graphString) {
			var graph = JSON.parse(graphString)

			if (!graph.root) {
				console.error('no root?', graph)
				return new('No root in '+gfsPath)
			}

			graph.root = migrateGraph(graph)

			console.log('  - OK', basename)
			console.log('  - graphs left', --totalGraphs)

			return gfs.writeString(gfsPath,
				JSON.stringify(graph))
		})
		.catch(function(err) {
			console.log('  ! NOT FOUND', basename)
		})
	})
}

// migrate the graphs and presets in the db
exports.execute = function() {
	var dfd = when.defer()

	function done(err) {
		mongoose.disconnect()
		gfs.close()

		if (err) {
			console.error('ERROR: ', err.stack)
			return dfd.reject(err)
		}

		dfd.resolve()
	}

	mongoose.connect(secrets.db)

	mongoose.connection.on('connected', function() {
		// do graphs in db
		Graph.find({}, function(err, graphs) {
			if (err)
				return done(err)

			return processGraphs(graphs)
			.then(function() {
				console.log('Processing presets')

				// do presets in db
				Preset.find({}, function(err, presets) {
					return processGraphs(presets)
					.then(function() { done() })
					.catch(done)
				})
			})
			.catch(done)
		})
	})

	mongoose.connection.on('error', done)

	return dfd.promise
}

if (require.main === module)
	exports.execute()
