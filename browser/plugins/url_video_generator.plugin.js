(function() {

var UrlVideo = E2.plugins.url_video_generator = function UrlVideo(core, node) {
	Plugin.apply(this, arguments)

	this.desc = 'Load an Ogg/Theora video.'
	
	this.input_slots = [
	]
	
	this.output_slots = [ 
		{ name: 'video', dt: core.datatypes.VIDEO, desc: 'A video stream.' }
	]
	
	this.state = { url: '' }
	this.gl = core.renderer.context
	this.core = core
	this.URL_VIDEO_ROOT = 'data/video/'
	this.video = null
	this.dirty = false
}

UrlVideo.prototype = Object.create(Plugin.prototype)

UrlVideo.prototype.reset = function() {}

UrlVideo.prototype.play = function() {
	if (this.video)
		this.video.play()
	console.trace('play video')
}

UrlVideo.prototype.create_ui = function() {
	var inp = makeButton('Source', 'No video selected.', 'url')
	var that = this

	function clickHandler() {
		var oldValue = that.state.url
		var newValue = oldValue

		function setValue(v) {
			that.state.url = newValue = v
			that.updated = true
			that.state_changed()
		}

		FileSelectControl
		.createModelSelector('video', oldValue, function(control) {
			control
			.selected(oldValue)
			.onChange(setValue.bind(this))
			.buttons({
				'Cancel': setValue.bind(this, oldValue),
				'Select': setValue.bind(this)
			})
			.on('closed', function() {
				if (newValue === oldValue)
					return
			
				that.undoableSetState('url', newValue, oldValue)
		
				that.dirty = true
			})
			.modal()
		})
	}

	inp.click(clickHandler)

	return inp
}

UrlVideo.prototype.update_state = function() {
	if (!this.dirty)
		return

	if (this.state.url)
		return this.loadVideo()
}

UrlVideo.prototype.update_output = function() {
	return this.video
}

UrlVideo.prototype.state_changed = function(ui) {
	if (!this.state.url)
		return

	if (ui)
		return ui.attr('title', this.state.url)

	this.loadVideo()
}

UrlVideo.prototype.loadVideo = function() {
	var that = this
	if (this.video) {
		this.video.pause()
		delete this.video
	}

	console.log('create video element')

	this.waitingToLoad = true

	E2.core.assetLoader
	.loadAsset('video', this.state.url)
	.then(function(video) {
		that.video = video
		that.waitingToLoad = false
		that.updated = true
	})
	.catch(function() {
		that.video = E2.core.assetLoader.defaultVideo
		that.waitingToLoad = false
		that.updated = true
	})

	this.dirty = false
}

})()
