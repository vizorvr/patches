const fs = require('fs')
const vm = require('vm')

var toMarkdown = require('to-markdown')

const createVizorSandbox = require('../lib/sandbox')

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

var docsPath = 'documentation/nodes'

var argv = require('minimist')(process.argv.slice(2))

if (!argv['f'] && !argv['o']) {
	console.log(`usage: generateNodeDocs [-o pluginId [otherPluginId] [...]] [-f]
	
	extracts the desc fields from all plugins and rewrites
	documentation in documentation/browser/nodes/

	giving pluginIds filters the operation to only the given plugin ids

	if no pluginIds are given, you need -f (force) to overwrite all
	existing plugin docs`)
	process.exit(1)
}

var onlyPlugins = argv['_'].length > 0 ? argv['_'].slice() : undefined

if (process.argv.indexOf('-o') !== -1) {
	onlyPlugins = process.argv.slice(process.argv.indexOf('-o') + 1)

	console.log('only plugins:', onlyPlugins)
}

function captureStrings(pluginId, pluginName, plugin) {
	var desc = plugin.desc

	var md = ''

	md += '# ' + pluginName + '\n\n'

	md += '## Description\n'
	md += toMarkdown(desc || "") + '\n\n'

	md += '## Inputs\n'

	for (var i = 0; i < plugin.input_slots.length; ++i) {
		var s = plugin.input_slots[i]

		// console.log('   i ', s.name, ':', s.dt.name, s.desc)

		md += '### ' + s.name + '\n\n'
		md += toMarkdown('*' + s.dt.name) + '*\n\n'
		md += toMarkdown(s.desc || '') + '\n\n'
	}

	md += '## Outputs\n'

	if (!plugin.output_slots.length)
		md += 'n/a\n\n'

	for (var i = 0; i < plugin.output_slots.length; ++i) {
		var s = plugin.output_slots[i]
		md += '### ' + s.name + '\n\n'
		md += toMarkdown('*' + s.dt.name) + '*\n\n'
		md += toMarkdown(s.desc || '') + '\n\n'
	}

	md += '## Detail\n\n'

	return md
}

pluginCats.map(function(cat) {
	var pluginNames = Object.keys(plugins[cat])

	pluginNames.map(function(pluginName) {
		var pluginDef = plugins[cat][pluginName]
		var pluginId = pluginDef.name
		if (onlyPlugins && onlyPlugins.indexOf(pluginId) === -1) {
			// skip if we're filtering
			return
		}
		var pluginSourcePath = pluginsPath+'/'+pluginId+'.plugin.js'

		var pluginSource = fs.readFileSync(pluginSourcePath)
		pluginSource += ';\n'
		pluginSource += 'var fakeNode = new Node(E2.core.root_graph, "'+pluginId+'");\n'
		pluginSource += 'var plugin = new E2.plugins.'+pluginId+'(E2.core, fakeNode);\n'

		script = new vm.Script(pluginSource, { filename: pluginId })
		script.runInContext(context)

		var md = captureStrings(pluginId, pluginName, context.plugin)

		fs.writeFileSync(docsPath + '/' + pluginId + '.md', md)
	})
})

