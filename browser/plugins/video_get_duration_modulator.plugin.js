E2.p = E2.plugins["video_get_duration_modulator"] = function(core, node)
{
	this.desc = 'Get the duration of the supplied video in seconds.';
	
	this.input_slots = [ 
		{ name: 'video', dt: core.datatypes.VIDEO, desc: 'Input video.', def: null }
	];
	
	this.output_slots = [
		{ name: 'duration', dt: core.datatypes.FLOAT, desc: 'Duration in seconds.', def: 0.0 }
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
