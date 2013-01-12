E2.p = E2.plugins["audio_player"] = function(core, node)
{
	this.desc = 'Play an audio stream. Playback loops.';
	
	this.input_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'The audio stream to play.' },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Send true to start playback and false to stop.', def: false },
		{ name: 'mute', dt: core.datatypes.BOOL, desc: 'Send true to mute playback and false to reenable audio.', def: false },
		{ name: 'volume', dt: core.datatypes.FLOAT, desc: 'Set playback volume.', lo: 0.0, hi: 0.0, def: 0.5 }
	];
	
	this.output_slots = [ 
		{ name: 'current time', dt: core.datatypes.FLOAT, desc: 'The current audio playback position in seconds.' },
		{ name: 'duration', dt: core.datatypes.FLOAT, desc: 'The audio duration in seconds.' }
	];

	this.audio = null;
	this.playing = false;
	this.should_play = false;
	this.muted = false;
	this.volume = 0.5;
};

E2.p.prototype.reset = function()
{
	if(this.audio && this.playing)
	{
		this.playing = this.should_play = false;
		this.audio.pause();
		this.audio.currentTime = 0;
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
		this.audio = data;
	else if(slot.index === 1)
		this.should_play = data;
	else if(slot.index === 2)
		this.muted = data;
	else if(slot.index === 3)
		this.volume = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
};

E2.p.prototype.update_state = function(delta_t)
{
	if(this.playing !== this.should_play)
	{
		if(this.audio)
		{
			if(this.should_play)
				this.audio.play();
			else
				this.audio.pause();			
		}
		
		this.playing = this.should_play;
	}
	
	if(this.audio)
	{
		this.audio.muted = this.muted;
		this.audio.volume = this.volume;
	}
};

E2.p.prototype.update_output = function(slot)
{
	if(!this.audio)
		return 0.0;
		
	if(this.playing)
		this.updated = true;
		
	if(slot.index === 0)
		return this.audio.currentTime;
		
	return this.audio.duration;
};
