(function() {

var AudioSourcePlayerPlugin = E2.plugins.audio_source_player = function(core, node) {
	this.desc = 'Plays a supplied audio source.'
	
	this.input_slots = [ 
		{ name: 'source', dt: core.datatypes.OBJECT,
			desc: 'The audio source to play.', def: null }
	]
	
	this.output_slots = []
	
	this.core = core
	this.node = node
	this.audioSource = null

	var that = this
}

AudioSourcePlayerPlugin.prototype.connection_changed = function(on, conn, slot) {
	if (!on && this.audioSource) {
		this.audioSource.player.stop_playback()
		this.audioSource = null
	}		
}

AudioSourcePlayerPlugin.prototype.update_input = function(slot, data) {
	if (slot.index === 0) {
		if (data && !data.context) {
			msg('ERROR: Can\'t play audio source.')
			return
		}
		
		if (!data && this.audioSource && this.audioSource.buffer)
			return this.audioSource.player.stop_playback()

		if (this.audioSource && this.audioSource !== data)
			this.audioSource.player.stop_playback()
		
		if (this.core.audioContext && data) {
			data.connect(this.core.audioContext.destination)
			
			if (data.player)
				data.player.start_playback()
		}

		this.audioSource = data
	}
}

AudioSourcePlayerPlugin.prototype.update_state = function() {
	this.updated = true
}

})()
