E2.p = E2.plugins["audio_get_current_time_modulator"] = function(core, node)
{
	this.desc = 'Get the current playback time of the supplied audio sample in seconds.';
	
	this.input_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'Input audio sample.' }
	];
	
	this.output_slots = [
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'Current playback time.', def: 0 }
	];
};

E2.p.prototype.reset = function()
{
	this.time = 0.0;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.time = data.currentTime;
};	

E2.p.prototype.update_output = function(slot)
{
	return this.time;
};
