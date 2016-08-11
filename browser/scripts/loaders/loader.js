(function() {

function Loader() {
	EventEmitter.call(this)
}
Loader.prototype = Object.create(EventEmitter.prototype)

Loader.prototype.errorHandler = function(err) {
	this.emit('error', err)
}

Loader.prototype.progressHandler = function(xhr) {
	if (!xhr.total) {
		lengthKnown = false
		return;
	}

	this.emit('progress', xhr.loaded / xhr.total)
}

Loader.prototype.assetExists = function(url) {
	var dfd = when.defer()

	url = '/stat' + url
	var http = new XMLHttpRequest()
	http.addEventListener('abort', function() {
		dfd.resolve(false)
	})
	http.addEventListener('error', function(err) {
		console.error(err.stack)
		dfd.reject(err)
	})
	http.onreadystatechange = function() {
		if (this.readyState === 4)
			dfd.resolve(this.status !== 404)
	}
	
	http.open('GET', url)
	http.send()

	return dfd.promise
}

E2.Loader = Loader
E2.Loaders = {}

if (typeof(module) !== 'undefined') {
	module.exports.Loader = Loader
}

})()
