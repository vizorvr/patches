(function() {

function ImageLoader(url) {
	E2.Loader.apply(this, arguments)
	var that = this
	var img = new Image()

	var CompleteCheck = function() {
		var count = 0

		var img = null
		var metadata = null

		var check = function() {
			++count

			if (count === 2) {
				that.onImageLoaded(img, metadata)
			}
		}

		this.imageLoaded = function(loadedImage) {
			img = loadedImage
			check()
		}

		this.metadataLoaded = function(loadedMetadata) {
			metadata = loadedMetadata
			check()
		}
	}

	var completeCheck = new CompleteCheck()

	var imageXhr = new XMLHttpRequest()
	imageXhr.open('GET', url, true)
	imageXhr.crossOrigin = 'Anonymous'
	imageXhr.responseType = 'arraybuffer'

	imageXhr.onerror = function() {
		that.errorHandler(new Error(this.status))
	}

	imageXhr.onload = (function() {
		var checker = completeCheck
		var xhr = this

		return function () {
			console.time('Parse image')

			if (this.status >= 400)
				return xhr.onerror()

			var blob = new Blob([this.response])
			img.src = window.URL.createObjectURL(blob)
			img.onload = function () {
				console.timeEnd('Parse image')
				checker.imageLoaded(img)
			}
		}
	})()

	imageXhr.onprogress = function(evt) {
		if (evt.total)
			that.emit('progress', evt.loaded / evt.total)
	}

	imageXhr.send()

	var metadataXhr = new XMLHttpRequest()
	metadataXhr.open('GET', '/meta' + url, true)
	metadataXhr.crossOrigin = 'Anonymous'
	metadataXhr.responseType = 'text'

	metadataXhr.onerror = function() {
		console.error('metadata error',url)
		that.errorHandler(new Error(this.status))
	}
	
	metadataXhr.onload = (function() {
		var checker = completeCheck

		return function() {
			var result = {}

			if (this.status < 400 && this.responseText) {
				result = JSON.parse(this.responseText)
			}

			checker.metadataLoaded(result)
		}
	})()

	metadataXhr.send()
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
