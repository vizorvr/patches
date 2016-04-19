var assert = require('assert');

var reset = require('./helpers').reset;
var loadPlugin = require('./helpers').loadPlugin;
var fs = require('fs');
var when = require('when');

var pluginPath = __dirname+'/../../plugins/'

describe('loadAllPlugins', function() {

	beforeEach(function() {
		reset()
		
	})

	var exceptions = [
		// legacy plugins used in unit tests (paste_complex)
		'mesh_renderer_emitter',
		'perspective_camera',
		'grid_mesh_generator',
		'concatenate_matrix_modulator',
		'scene_renderer_emitter',
	]

	it('loads all plugins', function(done) {
		var plugins = []
		var pluginInstances = []

		var dfd = when.defer()
		var promise = dfd.promise

		fs.readdir(pluginPath, function(err, files) {
			assert.ok(!err)

			for(var i = 0; i < files.length; ++i) {
				var filename = pluginPath + files[i]
				var pluginName = files[i].replace('\.plugin\.js', '')
				if (pluginName.indexOf('.') !== -1 || exceptions.indexOf(pluginName) !== -1) {
					// skip
					continue
				}

				var stat = fs.statSync(filename)
				if (!stat.isFile()) {
					continue
				}

				plugins.push(pluginName)
			}

			for(var i = 0; i < plugins.length; ++i) {
				assert.doesNotThrow(function() {
					pluginInstances.push(E2.app.instantiatePlugin(plugins[i]))
				})
			}

			assert.ok(plugins.length > 200)
			assert.equal(pluginInstances.length, plugins.length)

			done()
		})
	})
})
