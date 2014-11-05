E2.p = E2.plugins["audio_get_current_time_modulator"] = function(core, node)
{
	this.desc = 'Get the current playback time of the supplied audio sample in seconds.';
	
	this.input_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'Input audio sample.', def: null }
	];
	
	this.output_slots = [
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'Current playback time.', def: 0 }
	];
	
	// We want to continuously emit time, even when the source isn't changing.
	this.always_update = true;
};

E2.p.prototype.reset = function()
{
	this.time = 0.0;
	this.audio = null;
};

E2.p.prototype.update_state = function()
{
	this.time = this.audio ? this.audio.currentTime : 0.0;
 	this.updated = true;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.audio = data;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.time;
};
