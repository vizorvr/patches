E2.plugins["audio_player"] = function(core, node) {
	var self = this;
	
	this.desc = 'Play an audio stream. Playback loops.';
	this.input_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'The audio stream to play.' },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Send true to start playback and false to stop.' }
	];
	
	this.output_slots = [];
	
	this.audio = null;
	this.playing = false;
	this.should_play = false;
		
	this.reset = function()
	{
		if(self.audio && self.playing)
		{
			self.playing = self.should_play = false;
			self.audio.pause();
			self.currentTime = 0;
		}
	};
	
	this.update_input = function(slot, data)
	{
		if(slot.index === 0)
			self.audio = data;
		else
			self.should_play = data;
	};

	this.update_state = function(delta_t)
	{
		if(self.playing !== self.should_play)
		{
			if(self.audio)
			{
				if(self.should_play)
					self.audio.play();
				else
					self.audio.pause();			
			}
			
			self.playing = self.should_play;
		}
	};
};
