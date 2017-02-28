(function(){

var UrlAudioBuffer = E2.plugins.url_audio_buffer_generator = function(core, node) {
	Plugin.apply(this, arguments)
	this.desc = 'Load an audio sample from an URL.'

	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: '' }
	]

	this.output_slots = [
		{ name: 'buffer', dt: core.datatypes.OBJECT, desc: 'An audio buffer.' }
	]

	this.state = { url: null }
	this.core = core
	this.buffer = null
	this.dirty = false
}

UrlAudioBuffer.prototype = Object.create(Plugin.prototype)

UrlAudioBuffer.prototype.reset = function() {
	this.updated = false
}

UrlAudioBuffer.prototype.create_ui = function() {
	var inp = makeButton('Source', 'No audio selected.', 'url')
	var that = this

	inp.click(function() {
		var fsc = FileSelectControl.createAudioSelector(that.state.url)
		fsc.onChange(function(v) {
			var actualFile = fsc.getFileMetadata(v)
			that.undoableSetState('url', actualFile.path, that.state.url)
		})
	})

	return inp
}

UrlAudioBuffer.prototype.update_input = function(slot, data) {
	this.state.url = data
	this.state_changed(null)
}

UrlAudioBuffer.prototype.update_state = function() {
	var that = this

	if (!this.dirty)
		return

	if (!this.state.url)
		return

	if (this.core.audioContext) {
		var noextname = this.state.url.substring(0, this.state.url.lastIndexOf('.'))
		var extname = this.state.url.substring(this.state.url.lastIndexOf('.'))

		// force Safari/iOS to use m4a *only if the asset is an ogg*
		// allows us to switch between ogg for everything else and m4a for Safari
		if (extname === '.ogg') {
			if (E2.util.isMobile.iOS() || E2.util.isBrowser.Safari()) {
				this.state.url = noextname + '.m4a'
			}
		}

		E2.core.assetLoader
		.loadAsset('audiobuffer', this.state.url)
		.then(function(buffer) {
			if (!buffer)
				return

			that.buffer = buffer
			that.updated = true
		})
	}
	else
		msg('ERROR: Cannot create audio buffer. This browser does not support the required API.')

	this.dirty = false
}

UrlAudioBuffer.prototype.update_output = function() {
	return this.buffer
}

UrlAudioBuffer.prototype.state_changed = function(ui) {
	if (this.state.url !== '') {
		if (ui)
			ui.attr('title', this.state.url)
		else
			this.dirty = true
	}
}

})()
