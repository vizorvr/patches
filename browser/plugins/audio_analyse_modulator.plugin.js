E2.p = E2.plugins.audio_analyse_modulator = function(core) {
	this.desc = 'Frequency and time domain audio analysis.'
	
	this.input_slots = [ 
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'An audio source to analyse.', def: null },
		{ name: 'bin-count', dt: core.datatypes.FLOAT, desc: 'Number of FFT bins. Will be made power-of-two and clamped to 8-2048.', def: 32 },
		{ name: 'multiplier', dt: core.datatypes.FLOAT, desc: 'Multiplier for each bin value', def: 1.0 },
		{ name: 'smoothing', dt: core.datatypes.FLOAT, desc: 'Amount of FFT smoothing between frames', min: 0, max: 1, def: 0.9 }
	]
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'The unmodified supplied source.', def: null },
		{ name: 'fft-bins', dt: core.datatypes.ARRAY, desc: 'The FFT bins.', def: null }
	]
	
	this.analyser_node = core.audioContext ? core.audioContext.createAnalyser() : null
	
	this.always_update = true

	this.src = null
	this.fft_bins = null
	this.array = new ArrayBuffer(128)
	this.array.datatype = 6
	this.array.stride = 4
	this.first = true

	this.smoothing = 0.9
}

E2.p.prototype.reset = function() {
	this.first = true
}

E2.p.prototype.update_input = function(slot, data) {
	if (slot.name === 'source') {
		if (this.src)
			this.src.disconnect(0)
		
		this.src = data
		
		if (data) {
			data.connect(this.analyser_node)
			this.analyser_node.player = data.player
		}		
	} else if (slot.name === 'multiplier') {
		this.multiplier = data
	} else if (slot.name === 'smoothing') {
		this.smoothing = data
	} else if (slot.name === 'bin-count') {
		this.fft_bins = data

		this.array = new ArrayBuffer(this.fft_bins * 2)
		this.array.datatype = 6
		this.array.stride = 4
		this.data = new Float32Array(this.array)
		msg('FFT bins = ' + this.fft_bins)
	}
}

E2.p.prototype.update_state = function() {
	if (!this.analyser_node)
		return;

	if ((this.analyser_node.frequencyBinCount !== this.fft_bins) || this.first) {
		this.analyser_node.fftSize = this.fft_bins || 128
		this.first = false
	}

	this.analyser_node.smoothingTimeConstant = this.smoothing

	this.analyser_node.getFloatFrequencyData(this.data)
	var data = this.data

	for(var i=0; i < this.fft_bins * 4; i++) {
		data[i] = Math.pow(10, (data[i] / 20)) * this.multiplier
	}

}

E2.p.prototype.update_output = function(slot) {
	if (slot.index === 0)
		return this.analyser_node

	this.updated = true

	return this.array
}
