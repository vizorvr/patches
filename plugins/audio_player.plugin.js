E2.p = E2.plugins["audio_player"] = function(core, node)
{
	this.desc = 'Play an audio stream. Playback loops.';
	
	this.input_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'The audio stream to play.' },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Send true to start playback and false to stop.', def: false },
		{ name: 'mute', dt: core.datatypes.BOOL, desc: 'Send true to mute playback and false to reenable audio.', def: false },
		{ name: 'volume', dt: core.datatypes.FLOAT, desc: 'Set playback volume.', lo: 0.0, hi: 0.0, def: 0.5 },
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'Set playback time.' }
	];
	
	this.output_slots = [
	]
	
	this.audio = null;
	this.playing = false;
	this.should_play = false;
	this.muted = false;
	this.volume = 0.5;
	this.time = null;
};

E2.p.prototype.play = function()
{
	if(this.audio && !this.playing && this.should_play)
	{
		this.playing = this.should_play = true;
		this.audio.play();
	}
};

E2.p.prototype.pause = function()
{
	if(this.audio && this.playing)
	{
		this.playing = false;
		this.should_play = true;
		this.audio.pause();
	}
};

E2.p.prototype.stop = function()
{
	if(this.audio)
	{
		if(this.playing)
		{
			this.playing = this.should_play = false;
			this.audio.pause();
		}
		
		this.audio.currentTime = 0;
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		this.audio = data;
		this.playing = false;
	}
	else if(slot.index === 1)
		this.should_play = data;
	else if(slot.index === 2)
		this.muted = data;
	else if(slot.index === 3)
		this.volume = data < 0.0 ? 0.0 : data > 1.0 ? 1.0 : data;
	else if(slot.index === 4)
		this.time = data;
};

E2.p.prototype.update_state = function()
{
	var audio = this.audio;
	
	if(this.playing !== this.should_play)
	{
		if(audio)
		{
			if(this.should_play)
				audio.play();
			else
				audio.pause();
			
			this.playing = this.should_play;
		}
		
	}
	
	if(!this.playing)
		return;

	if(audio)
	{
		audio.muted = this.muted;
		audio.volume = this.volume;
		
		if(this.time)
		{
			audio.currentTime = this.time;
			this.time = null;
		}
	}

	this.updated = true;
};
