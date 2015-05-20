(function() {

function Store() {
	EventEmitter.call(this)
}

Store.prototype = Object.create(EventEmitter.prototype)

Store.prototype.publish = function(evt) {
	var objects = Array.prototype.slice.call(arguments, 1)
	this.emit.apply(this, [ evt ].concat(objects))
	this.broadcast.apply(this, arguments)
}

Store.prototype.broadcast = function(evt) {
	E2.app.channel.broadcast.apply(E2.app.channel.broadcast, arguments)
}

if (typeof(module) !== 'undefined')
	module.exports = Store
else
	window.Store = Store

})();
