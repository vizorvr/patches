E2.p = E2.plugins["audio_player"] = function(core, node)
{
	this.desc = 'Play an audio stream. Playback loops.';
	
	this.input_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'The audio stream to play.' },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Send true to start playback and false to stop.' }
	];
	
	this.output_slots = [];
	
	this.audio = null;
	this.playing = false;
	this.should_play = false;
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
	else
		this.should_play = data;
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
};
