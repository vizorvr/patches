const fs = require('fs')
const vm = require('vm')

var toMarkdown = require('to-markdown')

const presetsPath = 'browser/presets'

var presets = JSON.parse(fs.readFileSync(presetsPath + '/presets.json'))
var presetCats = Object.keys(presets)

var docsPath = 'documentation/patches'

var argv = require('minimist')(process.argv.slice(2))

if (!argv['f'] && !argv['o']) {
	console.log(`usage: generatePatchDocs [-o presetId [otherPresetId] [...]] [-f]
	
	generates stub docs for presets
	documentation in documentation/browser/patches/

	giving presetIds filters the operation to only the given preset ids

	if no presetIds are given, you need -f (force) to overwrite all
	existing preset docs`)
	process.exit(1)
}

var onlyPresets = argv['_'].length > 0 ? argv['_'].slice() : undefined

if (process.argv.indexOf('-o') !== -1) {
	onlyPresets = process.argv.slice(process.argv.indexOf('-o') + 1)

	console.log('only presets:', onlyPresets)
}

function captureStrings(presetId, presetName) {
	var md = ''
	md += '# ' + presetName + '\n\n'
	md += '## Description\n\n'
	md += 'No description yet\n\n'

	return md
}

presetCats.map(function(cat) {
	var presetNames = Object.keys(presets[cat])

	presetNames.map(function(presetName) {
		var presetDef = presets[cat][presetName]
		var presetId = presetDef.name
		if (onlyPresets && onlyPresets.indexOf(presetId) === -1) {
			// skip if we're filtering
			return
		}

		var md = captureStrings(presetId, presetName)

		fs.writeFileSync(docsPath + '/' + presetId + '.md', md)
	})
})

