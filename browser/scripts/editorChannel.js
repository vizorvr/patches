
function EditorChannel() {
	EventEmitter.call(this)

/*
	var that = this
	wsChannel
		.join('__editor__')
		.on('*', function(m) {
			console.log('EditorChannel IN: ', m.type)
			this.emit.apply(this, [m.type].concat(m.objects))
		}.bind(this))
*/
}

EditorChannel.prototype = Object.create(EventEmitter.prototype)

EditorChannel.prototype.broadcast = function(m) {
	// wsChannel.send('__editor__', m)
}

if (typeof(module) !== 'undefined')
	module.exports = EditorChannel