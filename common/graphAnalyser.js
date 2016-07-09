(function() {

var isNode = typeof(process) !== 'undefined'
var when = isNode ? require('when') : window.when

if (isNode) {
	E2 = require('../browser/scripts/core').E2
}

var loadingPlugins = Object.keys(E2.LOADING_NODES)

var audioPlugins = [
	'url_audio_buffer_generator',
	'url_audio_generator'
]

function GraphAnalyser(gfs) {
	this._fs = gfs
}

GraphAnalyser.prototype.parseAssets = function(graph) {
	var that = this
	var assets = {}
	var totalSize = 0
	var assetsFound = 0
	var stat = {
		size: 0,
		numAssets: 0,
		numNodes: 0,
		hasAudio: false,
		type: 'file'
	}

	function readRoot(graph) {
		if (!graph.nodes.length)
			return

		var patchNode = graph.nodes[0]
		var patchNodeId = patchNode.plugin
		var isPatchNode = (E2.GRAPH_NODES.indexOf(patchNodeId) > -1)	

		if (!isPatchNode)
			return;

		stat.type = patchNodeId

		return graph
	}

	function walkGraph(subgraph) {
		if (!subgraph.nodes)
			return when.resolve()

		return when.map(subgraph.nodes, function(node) {
			var id = node.plugin.id || node.plugin

			stat.numNodes++

			if (E2.GRAPH_NODES.indexOf(id) > -1)
				return walkGraph(node.graph || node.plugin.graph)

			if (loadingPlugins.indexOf(id) === -1)
				return

			var aurl = node.state ? node.state.url : node.plugin.state.url
			
			if (!aurl)
				return

			if (audioPlugins.indexOf(id) > -1)
				stat.hasAudio = true

			// on server, remove /data from path
			if (isNode)
				aurl = aurl.replace(/^\/data/, '')

			return that._fs.stat(aurl)
			.then(function(assetStat) {
				stat.numAssets++

				if (!assetStat) // not found
					return;

				stat.size += assetStat.length
			})
		})
	}

	
	readRoot(graph)
	
	return walkGraph(graph)
	.then(function() {
		return stat
	})
}

GraphAnalyser.prototype.analyseJson = function(graphJson) {
	var graph

	try {
		graph = JSON.parse(graphJson)
	} catch(e) {
		console.error('PARSE ERROR', e.stack, graphJson)
		return e
	}
	
	return this.analyseGraph(graph)
}

GraphAnalyser.prototype.analyseGraph = function(graph) {
	return this.parseAssets(!!graph.root ? graph.root : graph)
}

if (isNode)
	module.exports.GraphAnalyser = GraphAnalyser
else
	E2.GraphAnalyser = GraphAnalyser

})()

