var fs = require('fs')
var fsPath = require('path')
var marked = require('marked');

var pluginsList = JSON.parse(fs.readFileSync(__dirname+'/../browser/plugins/plugins.json'))
var presetsList = JSON.parse(fs.readFileSync(__dirname+'/../browser/presets/presets.json'))

function DocumentationController() {
}

DocumentationController.prototype.parsePluginDocumentation = function(markdown) {
	function getSubstring(str, beginMarker, endMarker) {
		var beginMarkerIndex = str.indexOf(beginMarker)
		var substr = beginMarkerIndex !== -1 ? str.substring(beginMarkerIndex + beginMarker.length) : ""
		var endMarkerIndex = substr.indexOf(endMarker)
		return (endMarkerIndex !== -1 ? substr.substring(0, endMarkerIndex) : substr).trim()
	}

	function getSubstrings(str, beginMarker, endMarker) {
		var result = []
		var workbuffer = str
		while (workbuffer.length > 0) {
			var ss = getSubstring(workbuffer, beginMarker, endMarker)
			if (!ss) {
				return result
			}

			workbuffer = workbuffer.substring(workbuffer.indexOf(ss) + ss.length)

			result.push(ss)
		}

		return result
	}

	var result = {
		desc: desc,
		inputs: [],
		outputs: []
	}

	var desc = getSubstring(markdown, '##Description', '\n\n')
	var inputs = getSubstring(markdown, '##Inputs', '##Outputs')
	var outputs = getSubstring(markdown, '##Outputs', '##Detail')

	result.desc = marked(desc)

	inputs = getSubstrings(inputs, '###', '\n\n')
	outputs = getSubstrings(outputs, '###', '\n\n')

	// extract Name (first line) from:
	// Name
	// Description
	function getName(str) {
		str = str.trim()
		var linelen = str.indexOf('\n')
		var name = linelen > 0 ? str.substring(0, linelen) : str
		if (!name) {
			console.error('no name in', str)
		}
		return name
	}

	// extract Description (everything but the first line) from:
	// ###Name
	// Description
	function getDesc(str) {
		str = str.trim()
		var linelen = str.indexOf('\n')
		var desc = linelen > 0 ? str.substring(linelen) : ""
		return desc
	}

	for (var i = 0; i < inputs.length; ++i) {
		result.inputs.push({name: getName(inputs[i]), desc: marked(getDesc(inputs[i]))})
	}
	for (var i = 0; i < outputs.length; ++i) {
		result.outputs.push({name: getName(outputs[i]), desc: marked(getDesc(outputs[i]))})
	}

	return result
}

DocumentationController.prototype.index = function(req, res, next) {
	var pluginsData = { categories: [ ] }
	var presetsData = { categories: [ ] }

	var cats = Object.keys(pluginsList)
	pluginsData.categories = cats.map(function(cat) {
		return {
			name: cat,
			plugins: Object.keys(pluginsList[cat])
				.map(function(pid) {
					return {
						name: pid,
						desc: 'jee '+pid
					}
				})
		}
	})

	cats = Object.keys(presetsList)
	presetsData.categories = cats.map(function(cat) {
		return {
			name: cat,
			presets: Object.keys(presetsList[cat])
				.map(function(pn) {
					return {
						name: pn,
						desc: 'jee '+pn
					}
				})
		}
	})

	console.log(pluginsData.categories[3])

	res.render('server/pages/docs/index', {
		layout: 'docs',
		title: 'Documentation',
		plugins: pluginsData,
		presets: presetsData,
	})
}

DocumentationController.prototype.getPluginDocumentation = function(req, res, next) {
	var pluginName = req.params.pluginName

	var pluginNameIsValid = /^[a-zA-Z0-9._-]*$/.test(pluginName)

	if (!pluginNameIsValid) {
		var err = new Error('Invalid Plugin name:' + pluginName)
		return res.json({ error: 404 })
	}

	var docPath = './documentation/browser/plugins/' + pluginName + ".md"

	var that = this

	fs.stat(docPath, function(err, exists) {
		if (err) {
			var e = new Error(err.toString()+docPath);
			e.status = 404

			return next(e)
		}

		fs.readFile(docPath, function(err, markdown) {
			if (err) {
				var e = new Error(err.toString()+docPath);
				e.status = 404
				return next(err)
			}

			res.json(that.parsePluginDocumentation(markdown.toString()))

		})
	})
}

module.exports = DocumentationController
