
function EditorChannel() {
	EventEmitter.call(this)

	var that = this
	wsChannel
		.join('__editor__')
		.on('*', function(m) {
			console.log('EditorChannel IN: ', m.type)
			this.emit.apply(this, [m.type].concat(m.objects))

			switch(m.type) {
				case 'nodeAdded':
					E2.app.dispatcher.dispatch({
						actionType: 'networkNodeAdded',
						graph: m.objects[0],
						node: m.objects[1],
						info: m.objects[2]
					})
					break;
				case 'connected':
					E2.app.dispatcher.dispatch({
						actionType: 'networkConnected',
						graph: m.objects[0],
						connection: m.objects[1]
					})
					break;
			}
		}.bind(this))
}

EditorChannel.prototype = Object.create(EventEmitter.prototype)

EditorChannel.prototype.broadcast = function(m) {
	wsChannel.send('__editor__', m)
}

if (typeof(module) !== 'undefined')
	module.exports = EditorChannel