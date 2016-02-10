var when = require('when')

var loadingPlugins = [
	'three_loader_model',
	'three_loader_scene',
	'url_texture_generator',
	'url_audio_buffer_generator',
	'url_audio_generator',
	'url_json_generator',
	'url_video_generator',
]

function GraphAnalyser(gfs) {
	this._fs = gfs
}

GraphAnalyser.prototype.parseAssets = function(graph) {
	var that = this
	var assets = {}
	var totalSize = 0
	var assetsFound = 0
	var stat = { size: 0, numAssets: 0 }

	function findInGraph(subgraph) {
		var dfd = when.defer()

		if (!subgraph.nodes) {
			dfd.resolve()
			return dfd.promise
		}

		return when.map(subgraph.nodes, function(node) {
			if (node.plugin === 'graph')
				return findInGraph(node.graph)

			if (loadingPlugins.indexOf(node.plugin) === -1)
				return

			var aurl = node.state.url.replace(/^\/data/, '')

			return that._fs.stat(aurl)
			.then(function(assetStat) {
				stat.numAssets++
				
				if (!assetStat) // not found
					return;

				stat.size += assetStat.length
			})
		})
	}

	return findInGraph(graph)
	.then(function() {
		return stat
	})
}

GraphAnalyser.prototype.analyse = function(graphJson) {
	var graph

	try {
		graph = JSON.parse(graphJson)
	} catch(e) {
		console.error('PARSE ERROR',e.stack, graphJson)
		return e
	}
	
	return this.parseAssets(graph.root)
}

module.exports.GraphAnalyser = GraphAnalyser


