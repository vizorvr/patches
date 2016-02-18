E2.p = E2.plugins.audio_buffer_source_modulator = function(core, node) {
	this.desc = 'Create a playable audio source from a buffer of audio data.'
	
	this.input_slots = [ 
		{ name: 'buffer', dt: core.datatypes.OBJECT, desc: 'An audio buffer to create a playable source from.', def: null },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Start or stop playback.', def: false },
		{ name: 'loop', dt: core.datatypes.BOOL, desc: 'Looping playback.', def: false },
		{ name: 'loop-start', dt: core.datatypes.FLOAT, desc: 'Start of loop (in seconds).', def: 0.0 },
		{ name: 'loop-end', dt: core.datatypes.FLOAT, desc: 'End of loop (in seconds).', def: 0.0 }
	]
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'A playable audio source', def: null }
	]
	
	this.core = core
	this.node = node
	this.audioSource = null
	this.playing = false
	this.should_play = false
	this.loop = false
	this.loop_start = 0.0
	this.loop_end = 0.0
	this.time = null
	this.state = 0
	
	this.update_source()
}

E2.p.prototype.reset = function() {
}

E2.p.prototype.play = function() {
	if (this.audioSource && !this.playing) {
		this.should_play = true
		this.updated = true
	}
}

E2.p.prototype.pause = function() {
	if (this.audioSource && this.playing) {
		this.playing = false
		this.should_play = true
		this.stop_playback()
		this.time = this.audioSource.currentTime
		this.audioSource = null
	}
}

E2.p.prototype.stop = function() {
	if (this.playing) {
		this.playing = this.should_play = false
		this.stop_playback()
		this.audioSource = null
	}
	
	this.time = 0.0
}

E2.p.prototype.connection_changed = function(on, conn, slot) {
	if (slot.index === 0) {
		if (!on && this.playing && this.node.outputs.length < 1) {
			this.stop_playback()
			this.audioSource = null
			this.playing = false
		}
	}		
}

E2.p.prototype.update_input = function(slot, data) {
	if (slot.index === 0) {
		if (this.buffer === data)
			return

		if (data && data.toString() !== '[object AudioBuffer]') {
			msg('ERROR: Can\'t create audio source from buffer: The supplied object isn\'t a valid AudioBuffer object.')
			return
		}
	
		if (this.playing) {
			if (this.audioSource)
				this.stop_playback()
			
			this.playing = false
		}
		
		this.buffer = data
		this.changed = true
	}
	else if (slot.index === 1) {
		if (this.should_play === data)
			return

		this.should_play = data
		this.changed = true
	}
	else if (slot.index === 2) {
		this.loop = data
	}
	else if (slot.index === 3) {
		this.loop_start = data
	}
	else if (slot.index === 4) {
		this.loop_end = data
	}
}	

E2.p.prototype.start_playback = function() {
	if (this.audioSource && this.audioSource.buffer !== null && this.state === 0) {
		this.audioSource.start()
		this.state++
	}
}

E2.p.prototype.stop_playback = function() {
	if (this.audioSource && this.state === 1) {
		this.audioSource.stop(0)
		this.state--
	}
}

E2.p.prototype.update_source = function() {
	if (!this.core.audioContext) {
		this.audioSource = null
		return
	}
	
	this.audioSource = this.core.audioContext.createBufferSource()
	this.audioSource.player = this
	this.state = 0
	
	if (this.buffer && this.playing)
		this.audioSource.buffer = this.buffer
}

E2.p.prototype.update_state = function() {
	if (this.changed) {
		if (this.playing !== this.should_play) {
			if (this.audioSource) {
				if (this.playing && !this.should_play)
					this.stop_playback()
			}
		
			this.playing = this.should_play
			this.update_source()
		}

		this.changed = false
	}

	if (this.audioSource) {
		if (this.audioSource.loop !== this.loop)
			this.audioSource.loop = this.loop
		
		if (this.audioSource.loopStart !== this.loop_start)
			this.audioSource.loopStart = this.loop_start
		
		if (this.audioSource.loopEnd !== this.loop_end)
			this.audioSource.loopEnd = this.loop_end
		
		if (this.time !== null) {
			this.audioSource.currentTime = this.time
			this.time = null
		}
	}
}

E2.p.prototype.update_output = function(slot) {
	return this.audioSource
}
