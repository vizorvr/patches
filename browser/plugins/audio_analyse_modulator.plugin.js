E2.p = E2.plugins["audio_analyse_modulator"] = function(core, node)
{
	this.desc = 'Frequency and time domain audio analysis.';
	
	this.input_slots = [ 
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'An audio source to analyse.', def: null },
		{ name: 'bin-count', dt: core.datatypes.FLOAT, desc: 'Number of FFT bins. Will be made power-of-two and clamped to 8-2048.', def: 32 }
	];
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'The unmodified supplied source.', def: null },
		{ name: 'fft-bins', dt: core.datatypes.ARRAY, desc: 'The FFT bins.', def: null }
	];
	
	this.analyser_node = core.audio_ctx ? core.audio_ctx.createAnalyser() : null;
	this.src = null;
	this.fft_bins = null;
	this.array = new ArrayBuffer(128);
	this.array.datatype = 6;
	this.array.stride = 4;
	this.first = true;
};

E2.p.prototype.reset = function()
{
	this.first = true;
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		if(this.src)
			this.src.disconnect(0);
		
		this.src = data;
		
		if(data)
		{
			data.connect(this.analyser_node);
			this.analyser_node.player = data.player;
		}		
	}
	else
	{
		this.fft_bins = Math.ceil(Math.log(data) / Math.log(2));
		this.fft_bins = this.fft_bins < 3 ? 3 : this.fft_bins > 11 ? 11 : this.fft_bins;
		this.fft_bins = Math.pow(2.0, this.fft_bins);
		this.array = new ArrayBuffer(this.fft_bins * 4);
		this.array.datatype = 6;
		this.array.stride = 4;
		msg('FFT bins = ' + this.fft_bins);
	}
};

E2.p.prototype.update_state = function()
{
	if((this.analyser_node.frequencyBinCount !== this.fft_bins) || this.first)
	{
		this.analyser_node.fftSize = this.fft_bins !== null ? this.fft_bins * 2 : 64.0;
		this.first = false;
	}
};

E2.p.prototype.update_output = function(slot)
{
	if(slot.index === 0)
		return this.analyser_node;
	
	if(this.analyser_node)
		this.analyser_node.getFloatFrequencyData(new Float32Array(this.array));
		
	this.updated = true;
	return this.array;
};
