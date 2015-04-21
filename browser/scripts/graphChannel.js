
function GraphChannel(app) {
	var that = this
	var api = E2.app.graphApi
	
	wsChannel
		.join('__dag')
		.on('__dag', function(m) {
			console.log('GraphChannel IN: dag messge', m)

			var g = Graph.resolve_graph(E2.core.graphs, m.gid ? m.gid : 0)

			switch(m.evt) {
				case 'connected':
					var c = new Connection()
					c.deserialise(m.data)
					c._isFromNetwork = true
					c = api.connect(g, c)
					break;
				case 'nodeAdded':
					var n = new Node(g)
					n.deserialise(m.guid, m.data)
					n._isFromNetwork = true
					n = api.addNode(g, n)
					break;
			}
		})

}
// GraphChannel.prototype = Object.create(EventEmitter.prototype)
GraphChannel.prototype.broadcast = function(m) {
	console.log('broadcast', m.evt)
	wsChannel.send('__dag', m)
}

