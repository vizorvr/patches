(function() {

function VideoLoader(url) {
	E2.Loader.apply(this, arguments)
	var that = this

	function loadVideo() {
		var dfd = when.defer()

		var video = document.createElement('video')
		video.crossOrigin = 'Anonymous'
		video.loop = true
		video.preload = 'auto'
		video.controls = false

		video.addEventListener('loadstart', function() {
			return dfd.resolve({
				video: video
			})
		})

		video.addEventListener('error', function() {
			that.errorHandler(new Error(this.status))
			video = null
		})

		video.src = url

		return dfd.promise
	}

	loadVideo().then(function(data) {
		return that.onVideoLoaded(data.video)
	})
}

VideoLoader.prototype = Object.create(E2.Loader.prototype)
VideoLoader.prototype.onVideoLoaded = function(video) {
	this.emit('loaded', video)
}

E2.Loaders.VideoLoader = VideoLoader

if (typeof(module) !== 'undefined') {
	module.exports.VideoLoader = VideoLoader
}

})()
