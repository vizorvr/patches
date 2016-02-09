var fs = require('fs')
var fsPath = require('path')
var marked = require('marked');

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

	for (var i = 0; i < inputs.length; ++i) {
		result.inputs.push(marked(inputs[i]))
	}
	for (var i = 0; i < outputs.length; ++i) {
		result.outputs.push(marked(outputs[i]))
	}

	return result
}

DocumentationController.prototype.getPluginDocumentation = function(req, res, next) {
	var docPath = './documentation/browser/plugins/' + req.params.pluginName + ".md"

	console.log('fetching docs for ', docPath)

	var that = this

	fs.stat(docPath, function(err, exists) {
		if (err) {
			console.error(err, docPath)
			return
		}

		fs.readFile(docPath, function(err, markdown) {
			if (err) {
				console.error(err, docPath)
				throw err
			}

			res.json(that.parsePluginDocumentation(markdown.toString()))
		})
	})
}

module.exports = DocumentationController;
