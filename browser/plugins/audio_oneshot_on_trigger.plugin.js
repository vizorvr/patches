(function() {

var AudioOneShotPlayer = E2.plugins.audio_oneshot_on_trigger = function(core) {
	this.desc = 'Trigger playback of a one-shot audio sample.'
	
	this.core = core

	this.input_slots = [ 
		{ name: 'buffer', dt: core.datatypes.OBJECT, desc: 'An audio buffer to create a playable source from.', def: null },
		{ name: 'trigger', dt: core.datatypes.BOOL, desc: 'Play the sound.', def: false }
	]

	this.shouldPlay = false
}

AudioOneShotPlayer.prototype.update_input = function(slot, data) {
	if (slot.index === 0) {
		if (this.buffer === data)
			return

		if (data && data.toString() !== '[object AudioBuffer]')
			return msg('ERROR: Can\'t create audio source from buffer: The supplied object isn\'t a valid AudioBuffer object.')
	
		this.buffer = data
	} else if (slot.index === 1) {
		this.shouldPlay = data
	}
}	

AudioOneShotPlayer.prototype.playSound = function() {
	if (!this.core.audioContext)
		return

	var source = this.core.audioContext.createBufferSource()
	source.buffer = this.buffer
	source.connect(this.core.audioContext.destination)
	source.start()
}

AudioOneShotPlayer.prototype.update_state = function() {
	if (this.shouldPlay && this.buffer) {
		this.playSound()
		this.shouldPlay = false
	}
}

})()
