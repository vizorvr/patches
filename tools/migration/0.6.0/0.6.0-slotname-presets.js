var fs = require('fs')

var migrateGraphFile = require('./migrate').migrateGraphFile

var presetsPath = __dirname+'/../../../browser/presets/'
var presets = JSON.parse(fs.readFileSync(
	presetsPath + 'presets.json'))

var when = require('when')

exports.execute = function() {
	var dfd = when.defer()

	// first presets
	Object.keys(presets).map(function(category) {
		Object.keys(presets[category]).map(function(title) {
			var pdef = presets[category][title]
			var ppath =  presetsPath + pdef.name+'.json'

			migrateGraphFile(ppath)
		})
	})

	// then defaults & templates
	var defaultGraphsPath = __dirname+'/../../../browser/data/graphs'
	fs.readdirSync(defaultGraphsPath).map(function(fn) {
		if (fn[0] === '.')
			return;

		migrateGraphFile(defaultGraphsPath+'/'+fn)
	})

	dfd.resolve()

	return dfd.promise
}

if (require.main === module)
	exports.execute()
