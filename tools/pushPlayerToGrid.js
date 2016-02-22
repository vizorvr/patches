var fs = require('fs')

var when = require('when')

var secrets = require('../config/secrets')

var fs = require('fs')

var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../package.json'))
var currentPlayerVersion = packageJson.version.split('.').slice(0,2).join('.')

module.exports = function() {
	var dfd = when.defer()
	var mongoose = require('mongoose')
	var GridFsStorage = require('../lib/gridfs-storage')

	mongoose.connect(secrets.db)
	mongoose.connection.once('error', function(err) {
		dfd.reject(err)
	})

	mongoose.connection.once('connected', function() {
		var gfs = new GridFsStorage('/data')
		gfs.on('ready', function() {
			var playerSource = fs.readFileSync(__dirname+'/../browser/dist/player.min.js')
			var destPath = '/dist/'+currentPlayerVersion+'/player.min.js'

			gfs.writeString(destPath, playerSource, 'utf8')
			.then(function() {
				gfs.close()
				mongoose.disconnect()
				mongoose = undefined
				dfd.resolve()
			})
			.catch(function(err) {
				dfd.reject(err)
			})
		})
	})

	return dfd.promise
}
