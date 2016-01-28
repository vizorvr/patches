const fs = require('fs')
const vm = require('vm')

const createVizorSandbox = require('./sandbox')

const browserPath = __dirname+'/../browser'
const pluginsPath =  browserPath+'/plugins'

module.exports = function parsePluginSlots() {
	var sandbox = createVizorSandbox()
	var context = new vm.createContext(sandbox)

	var engineSource = fs.readFileSync(browserPath+'/scripts/engine.js')
	engineSource += ';\nE2.core = new Core();\n'
	engineSource += ';\nE2.app = { player: { core: E2.core }};\n'
	engineSource += 'E2.core.root_graph = new Graph();\n'

	var engineScript = new vm.Script(engineSource, { filename: 'engine.js' })
	engineScript.runInContext(context)

	var slotMap = {}

	function seenSlot(pluginId, slotType) {
		var key = pluginId + '.' + slotType

		return function(slot) {
			if (!slotMap[key])
				slotMap[key] = []

			slotMap[key].push(slot.name)
		}
	}

	var plugins = JSON.parse(fs.readFileSync(pluginsPath + '/plugins.json'))
	var pluginCats = Object.keys(plugins)

	pluginCats.map(function(cat) {
		var pluginNames = Object.keys(plugins[cat])

		pluginNames.map(function(pluginName) {
			var pluginId = plugins[cat][pluginName]
			var pluginSourcePath = pluginsPath+'/'+pluginId+'.plugin.js'

			var pluginSource = fs.readFileSync(pluginSourcePath)
			pluginSource += ';\n'
			pluginSource += 'var fakeNode = new Node(E2.core.root_graph, "'+pluginId+'");\n'
			pluginSource += 'var plugin = new E2.plugins.'+pluginId+'(E2.core, fakeNode);\n'

			script = new vm.Script(pluginSource, { filename: pluginId })
			script.runInContext(context)

			sandbox.plugin.input_slots.map(seenSlot(pluginId, 0))
			sandbox.plugin.output_slots.map(seenSlot(pluginId, 1))
		})
	})

	return slotMap
}