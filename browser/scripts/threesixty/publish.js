var TEMPLATE_URL = "/patches/_template-360-photo.json"

function ThreeSixtyPublisher() {}

ThreeSixtyPublisher.prototype = Object.create(EventEmitter.prototype)

// STEP 2
// Fetch the 360 template from our server and publish a graph with
// image url from passed in url
ThreeSixtyPublisher.prototype.publishTemplateWithUrl = function(imageUrl) {
	var dfd = when.defer()

	$.ajax({
		url: TEMPLATE_URL,
		type: 'GET',
		dataType: 'json',

		success: function(graph) {
			var urlReplaced = false

			// Go through the graph 'nodes' field and find the URL
			// for the 360 template we are replacing
			var nodes = graph.root.nodes

			for (var i=0; i < nodes.length; i++) {
				var node = nodes[i]

				// Check if we have the correct node, the 360 graph
				// has this node generating the texture
				if (node.plugin === 'url_texture_generator') {
					node.state.url = imageUrl
					urlReplaced = true
				}
			}

			// Found the url, generate the graph data and upload
			if (urlReplaced === true) {
				var name = 'n/a'
				var data = {
					'path': name,
					'graph': JSON.stringify(graph)
				}

				E2.app.player.stop()

				E2.app.player.load_from_object(graph, function() {
					E2.core.once('player:firstFramePlayed', function() {
						that.uploadGraph(data.graph, function(asset) {
							that.emit('progress', 55)
							dfd.resolve(asset, data)
						})
					})

					E2.app.player.play()
				})
			}
		},

		error: function(err) {
			var errMsg = err.responseJSON ? err.responseJSON.message : err.status
			dfd.reject('Could not load data', errMsg)
		}
	})

	return dfd.promise
}
