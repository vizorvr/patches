var fs = require('fs')
var fsPath = require('path')
var marked = require('marked')
var when = require('when')

var pluginsList = JSON.parse(fs.readFileSync(__dirname+'/../browser/plugins/plugins.json'))
var presetsList = JSON.parse(fs.readFileSync(__dirname+'/../browser/presets/presets.json'))

var docsRoot = __dirname+'/../documentation/'

function make404(docPath) {
	var notFoundError = new Error('Not found: '+docPath)
	notFoundError.status = 404
	return notFoundError;
}

function DocumentationController() {
	var that = this

	console.time('Build docs')

	// build cache
	this.buildIndex('nodes', pluginsList)
	.then(function(cats) {
		return that.buildIndex('patches', presetsList)
	})
	.then(function() {
		console.timeEnd('Build docs')
	})
}

DocumentationController.prototype.parsePresetDocumentation = function(markdown) {
	return {
		desc: 'jee'
	}
}

DocumentationController.prototype.getMarkdownHeadline = function(markdown) {
	var matches = markdown.match(/#\s(.*)/g)
	if (!matches)
		return;
	var headline = matches[0].substring(2)
	return headline
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

	var desc = getSubstring(markdown, '## Description', '\n\n')
	var inputs = getSubstring(markdown, '## Inputs', '## Outputs')
	var outputs = getSubstring(markdown, '## Outputs', '## Detail')

	result.desc = marked(desc)

	inputs = getSubstrings(inputs, '### ', '#')
	outputs = getSubstrings(outputs, '### ', '#')

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

DocumentationController.prototype.buildIndex = function(folder, list) {
	var cacheName = folder + 'Index'
	if (cache[cacheName])
		return when.resolve(cache[cacheName])

	var that = this

	var cats = Object.keys(list)

	return when.map(cats, function(cat) {
		// plugins/presets in category
		return when.map(Object.keys(list[cat]), function(itemName) {
			var itemDef = list[cat][itemName]
			return that.readMarkdown(folder+'/'+itemDef.name)
			.catch(function() {})
			.then(function(docs) {
				var detail = {
					name: itemDef.name,
					title: itemName
				}

				cache[itemDef.name] = detail

				return detail
			})
		})
		.then(function(items) {
			return { name: cat, items: items }
		})
	}, 0)
	.then(function(cats) {
		cache[cacheName] = cats
		return cats
	})
}

DocumentationController.prototype.index = function(req, res, next) {
	var that = this

	this.readMarkdown('index')
	.then(function(md) {
		res.setHeader('Cache-Control', 'public')
		res.render('server/pages/docs/front', {
			layout: 'docs',
			title: 'Vizor Documentation',
			doc: md
		})
	})
}


DocumentationController.prototype.detail = function(req, res, next) {
	var that = this
	var folder = req.params.folder
	var item = req.params.item
	var niceFolder = folder[0].toUpperCase() + folder.substring(1)
	var docPath = docsRoot + folder + '/' + item + '.md'

	fs.readFile(docPath, function(err, markdown) {
		if (err)
			return next(make404(docPath))

		if (req.xhr && folder === 'nodes')
			return res.json(that.parsePluginDocumentation(markdown.toString()))

		res.render('server/pages/docs/detail', {
			layout: 'docs',
			title: 'Vizor Docs - ' + item,
			folder: folder,
			niceFolder: niceFolder,
			doc: marked(markdown.toString())
		})
	})
}

DocumentationController.prototype.readFolder = function(folder) {
	var that = this
	var dfd = when.defer()
	var niceFolder = folder[0].toUpperCase() + folder.substring(1)
	var docFolder = docsRoot + folder + '/'
	
	fs.readdir(docFolder, function(err, items) {
		if (err)
			return dfd.reject(make404(docPath))

		when.map(items, function(item) {
			var mdfd = when.defer()
			var itemName = item.substring(0, item.lastIndexOf('.'))

			fs.readFile(docFolder+item, function(err, md) {
				if (err)
					return mdfd.reject(err)

				mdfd.resolve({
					path: folder+'/'+itemName,
					title: that.getMarkdownHeadline(md.toString()) || itemName
				})
			})

			return mdfd.promise
		})
		.catch(function(err) {
			dfd.reject(err)
		})
		.then(function(items) {
			dfd.resolve(items)
		})
	})

	return dfd.promise
}

// index for a folder of eg. howtos, patches, nodes
DocumentationController.prototype.folderIndex = function(req, res, next) {
	var folder = req.params.folder
	var niceFolder = folder[0].toUpperCase() + folder.substring(1)

	this.readFolder(folder)
	.then(function(items) {
		res.render('server/pages/docs/folder', {
			layout: 'docs',
			title: 'Vizor Docs - ' + niceFolder,
			items: items,
			folder: niceFolder
		})
	})
}

DocumentationController.prototype.nodesIndex = function(req, res, next) {
	var nodesData = {}
	var that = this

	this.buildIndex('nodes', pluginsList)
	.then(function(cats) {
		nodesData.categories = cats
		res.setHeader('Cache-Control', 'public')
		res.render('server/pages/docs/nodes', {
			layout: 'docs',
			title: 'Vizor Docs - Nodes',
			nodes: nodesData
		})
	})
}

DocumentationController.prototype.patchesIndex = function(req, res, next) {
	var patchesData = {}
	var that = this

	this.buildIndex('patches', presetsList)
	.then(function(cats) {
		patchesData.categories = cats

		res.setHeader('Cache-Control', 'public')
		res.render('server/pages/docs/patches', {
			layout: 'docs',
			title: 'Vizor Docs - patches',
			patches: patchesData
		})
	})
}

var cache = {}
DocumentationController.prototype.readMarkdown = function(itemName) {
	var dfd = when.defer()
	var docPath = docsRoot + itemName + ".md"
	var that = this

	function errorHandler(err) {
		var notFoundError = make404(docPath)
		cache[itemName] = notFoundError
		dfd.reject(notFoundError)
	}

	if (cache[itemName]) {
		if (cache[itemName] instanceof Error)
			return when.reject(cache[itemName])
		else
			return when.resolve(cache[itemName])
	} 

	fs.stat(docPath, function(err, exists) {
		if (err) return errorHandler(err)

		fs.readFile(docPath, function(err, markdown) {
			if (err) return errorHandler(err)

			cache[itemName] = markdown.toString()

			dfd.resolve(cache[itemName])
		})
	})

	return dfd.promise
}


module.exports = DocumentationController
