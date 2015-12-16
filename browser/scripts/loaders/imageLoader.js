(function() {

function ImageLoader(url) {
	E2.Loader.apply(this, arguments)
	var that = this
	var img = new Image()

	var xhr = new XMLHttpRequest()
	xhr.open('GET', url, true)
	xhr.crossOrigin = 'Anonymous'
	xhr.responseType = 'arraybuffer'

	xhr.onerror = function(err) {
		that.emit('error', err.responseText)
	}

	xhr.onload = function() {
		console.time('Parse image')
		var blob = new Blob([this.response])
		img.src = window.URL.createObjectURL(blob)
		console.timeEnd('Parse image')
		that.onImageLoaded(img)
	}

	xhr.onprogress = function(evt) {
		if (evt.total)
			that.emit('progress', evt.loaded / evt.total)
	}

	xhr.send()
}
ImageLoader.prototype = Object.create(E2.Loader.prototype)
ImageLoader.prototype.onImageLoaded = function(img) {
	this.emit('loaded', img)
}

E2.Loaders.ImageLoader = ImageLoader

if (typeof(module) !== 'undefined') {
	module.exports.ImageLoader = ImageLoader
}

})()
