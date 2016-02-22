var assert = require('assert');
const fs = require('fs')
const vm = require('vm')

const createVizorSandbox = require('../../../lib/sandbox')

const pluginsPath = 'browser/plugins'

var sandbox = createVizorSandbox()
var context = new vm.createContext(sandbox)

var engineSource = fs.readFileSync('browser/dist/engine.js')
engineSource += ';\nE2.core = new Core();\n'
engineSource += ';\nE2.app = { player: { core: E2.core }};\n'
engineSource += 'E2.core.root_graph = new Graph();\n'

var engineScript = new vm.Script(engineSource, { filename: 'engine.js' })
engineScript.runInContext(context)

var plugins = JSON.parse(fs.readFileSync(pluginsPath + '/plugins.json'))
var pluginCats = Object.keys(plugins)

var DocumentationController = require('../../../controllers/documentationController');

var docsPath = 'documentation/browser/plugins/'

function jsonChecker(pluginId, inputSlots, outputSlots, finishCallback) {
	return function (data) {
		function slotMapper(docSlots) {
			return function (slot) {
				for (var i = 0, len = docSlots.length; i < len; ++i) {
					if (docSlots[i].name === slot.name) {
						return
					}
				}

				console.error(pluginId + '.' + slot.name, 'missing markdown documentation in', docsPath + pluginId + '.md')

				assert.ok(false, 'no slot for ' + pluginId + '.' + slot.name)
			}
		}

		inputSlots.slice().map(slotMapper(data.inputs))
		outputSlots.slice().map(slotMapper(data.outputs))

		finishCallback()
	}
}

describe('plugin docs', function() {
	var dc

	beforeEach(function() {
		dc = new DocumentationController()
	})

	it('has entries for all plugins', function(done) {
		var todo = 0
		// count plugins
		pluginCats.map(function(cat) {
			var pluginNames = Object.keys(plugins[cat])
			pluginNames.map(function() {
				++todo
			})
		})

		assert.ok(todo > 200)

		// process plugins
		pluginCats.map(function(cat) {
			var pluginNames = Object.keys(plugins[cat])

			pluginNames.map(function (pluginName) {
				var pluginId = plugins[cat][pluginName]
				var pluginSourcePath = pluginsPath + '/' + pluginId + '.plugin.js'

				var pluginSource = fs.readFileSync(pluginSourcePath)
				pluginSource += ';\n'
				pluginSource += 'var fakeNode = new Node(E2.core.root_graph, "' + pluginId + '");\n'
				pluginSource += 'var plugin' + pluginId + ' = new E2.plugins.' + pluginId + '(E2.core, fakeNode);\n'

				script = new vm.Script(pluginSource, {filename: pluginId})
				script.runInContext(context)

				var res = {}

				dc.getPluginDocumentation({
					params: {
						pluginName: pluginId
					}
				}, {
					json: jsonChecker(pluginId, context['plugin' + pluginId].input_slots, context['plugin' + pluginId].output_slots, function() {
						--todo
						if (!todo) {
							done()
						}
					})
				}, function(e) {done(e)})
			})
		})
	})
})

