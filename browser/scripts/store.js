(function() {

function serialize(objects) {
	return objects.map(function(ob) {
		if (ob instanceof Graph)
			return ob.uid

		if (!ob.serialise) {
			console.error('Unserializable object passed to publish', ob)
			return;
		}

		return ob.serialise()		
	})
}

function Store() {
	EventEmitter.call(this)
}

Store.prototype = Object.create(EventEmitter.prototype)

Store.prototype.publish = function(evt) {
	var otwMessage = {
		type: evt
	}

	var objects = Array.prototype.slice.call(arguments, 1)

console.log('publish', evt, objects.length)

	otwMessage.objects = serialize(objects)

	E2.app.channel.broadcast(otwMessage)

	this.emit.apply(this, [ evt ].concat(objects))
}

if (typeof(module) !== 'undefined')
	module.exports = Store
else
	window.Store = Store
})()
