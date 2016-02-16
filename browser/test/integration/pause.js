var assert = require('assert');

var helpers = require('./helpers')
var reset = require('./helpers').reset;
var loadPlugin = require('./helpers').loadPlugin;
var fs = require('fs');
var when = require('when');

var pluginPath = __dirname+'/../../plugins/'

describe('pause', function() {
	var core, app

	beforeEach(function() {
		reset()
	})

	it('uses correct time in subgraph', function() {
		var source = JSON.parse(fs.readFileSync(__dirname+'/../fixtures/pause-subgraph.json'))
		source = source.root ? source.root : source
		E2.app.paste(source, 0, 0)

		var ag = E2.core.active_graph

		var floatNode = ag.nodes[0]
		var subGraphNode = ag.nodes[2]
		var clockNode = ag.nodes[1]

		ag.update({abs_t: 0, delta_t: 1/60})
		assert.equal(floatNode.plugin.value, 0)
		ag.update({abs_t: 1/60, delta_t: 1/60})
		assert.equal(floatNode.plugin.value, 1/60)
		ag.update({abs_t: 1/60, delta_t: 0})
		assert.equal(floatNode.plugin.value, 1/60)

	})

	var exceptions = [
		// legacy plugins used in unit tests (paste_complex)
		'mesh_renderer_emitter',
		'perspective_camera',
		'grid_mesh_generator',
		'concatenate_matrix_modulator',
		'scene_renderer_emitter',

		// these will need to be fixed:
		'viewport_height_generator',
		'viewport_width_generator',

		'three_webgl_renderer'
	]

	it('plugins won\'t crash when paused', function(done) {
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
					var ag = E2.core.active_graph

					ag.update({abs_t: 0, delta_t: 1/60})

					ag.update({abs_t: 1/60, delta_t: 0})
				})
			}

			assert.ok(plugins.length > 200)
			assert.equal(pluginInstances.length, plugins.length)

			done()
		})
	})
})