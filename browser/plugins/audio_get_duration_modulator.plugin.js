E2.p = E2.plugins["audio_get_duration_modulator"] = function(core, node)
{
	this.desc = 'Get the duration of the supplied audio sample in seconds.';
	
	this.input_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'Input audio sample.', def: null }
	];
	
	this.output_slots = [
		{ name: 'duration', dt: core.datatypes.FLOAT, desc: 'Duration in seconds.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.duration = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.duration = data ? data.duration : 0.0;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.duration;
};
