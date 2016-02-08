(function() {

function AudioBufferLoader(url) {
	E2.Loader.apply(this, arguments)
	var that = this

	var xhr = new XMLHttpRequest()
	xhr.open('GET', url, true)
	xhr.crossOrigin = 'Anonymous'
	xhr.responseType = 'arraybuffer'

	xhr.onerror = function() {
		that.errorHandler(new Error(this.status))
	}

	xhr.onload = function() {
		if (this.status >= 400)
			return this.onerror()

		E2.core.audioContext
		.decodeAudioData(this.response, function(buffer) {
			that.onLoaded(buffer)
		})
	}

	xhr.onprogress = function(evt) {
		if (evt.total)
			that.emit('progress', evt.loaded / evt.total)
	}

	xhr.send()
}

AudioBufferLoader.prototype = Object.create(E2.Loader.prototype)

AudioBufferLoader.prototype.onLoaded = function(buf) {
	this.emit('loaded', buf)
}

E2.Loaders.AudioBufferLoader = AudioBufferLoader

if (typeof(module) !== 'undefined') {
	module.exports.AudioBufferLoader = AudioBufferLoader
}

})()
