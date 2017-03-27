var fs = require('fs')
var when = require('when')
var config = require('../config/config')
var secrets = require('../config/secrets')

var packageJson = JSON.parse(fs.readFileSync(__dirname+'/../package.json'))
var currentPlayerVersion = packageJson.version.split('.').slice(0,2).join('.')

module.exports = function() {
	var dfd = when.defer()
	var mongoose = require('mongoose')
	var CloudFileSystemImpl
	if (config.server.useCDN)
	 	CloudFileSystemImpl = require('../lib/cloudStorage')
	else
		CloudFileSystemImpl = require('../lib/gridfs-storage')

	mongoose.connect(secrets.db)
	mongoose.connection.once('error', function(err) {
		dfd.reject(err)
	})

	mongoose.connection.once('connected', function() {
		var gfs = new CloudFileSystemImpl()
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
