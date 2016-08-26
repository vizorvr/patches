var fs = require('fs')
var fsPath = require('path')
var secrets = require('../../../config/secrets')
var mongoose = require('mongoose')
var when = require('when')
var nodefn = require('when/node')
var _ = require('lodash')

// migrate the graphs and patches in the db
exports.execute = function() {
	var dfd = when.defer()

	function done(err) {
		mongoose.disconnect()

		if (err) {
			console.error('ERROR: ', err.stack)
			return dfd.resolve()
		}

		dfd.resolve()
	}

	mongoose.connect(secrets.db)

	mongoose.connection.once('connected', function() {
		mongoose.connection.db
			.renameCollection('presets', 'patches', function(err) {
				done(err)
			})
	})

	mongoose.connection.on('error', done)

	return dfd.promise
}

if (require.main === module)
	exports.execute()
