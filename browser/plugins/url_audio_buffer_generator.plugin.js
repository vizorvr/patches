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
	var self = this

	inp.click(function() {
		FileSelectControl
			.createAudioSelector(self.state.url)
			.onChange(function(v) {
				self.undoableSetState('url', v, self.state.url)
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
	
	if (this.core.audioContext) {
		E2.core.assetLoader
		.loadAsset('audiobuffer', this.state.url)
		.then(function(buffer) {
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
