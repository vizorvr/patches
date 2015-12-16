(function() {

function Loader() {
	EventEmitter.call(this)
}
Loader.prototype = Object.create(EventEmitter.prototype)

Loader.prototype.errorHandler = function(xhr) {
	this.emit('error', xhr.responseText)
}

Loader.prototype.progressHandler = function(xhr) {
	if (!xhr.total) {
		lengthKnown = false
		return;
	}

	this.emit('progress', xhr.loaded / xhr.total)
}

E2.Loader = Loader
E2.Loaders = {}

if (typeof(module) !== 'undefined') {
	module.exports.Loader = Loader
}

})()
