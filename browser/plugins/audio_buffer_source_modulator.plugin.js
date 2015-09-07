E2.p = E2.plugins["audio_buffer_source_modulator"] = function(core, node)
{
	this.desc = 'Create a playable audio source from a buffer of audio data.';
	
	this.input_slots = [ 
		{ name: 'buffer', dt: core.datatypes.OBJECT, desc: 'An audio buffer to create a playable source from.', def: null },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Start or stop playback.', def: false },
		{ name: 'loop', dt: core.datatypes.BOOL, desc: 'Looping playback.', def: false },
		{ name: 'loop-start', dt: core.datatypes.FLOAT, desc: 'Start of loop (in seconds).', def: 0.0 },
		{ name: 'loop-end', dt: core.datatypes.FLOAT, desc: 'End of loop (in seconds).', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'A playable audio source', def: null }
	];
	
	this.core = core;
	this.node = node;
	this.audio_src = null;
	this.playing = false;
	this.should_play = false;
	this.loop = false;
	this.loop_start = 0.0;
	this.loop_end = 0.0;
	this.time = null;
	this.state = 0;
	
	this.update_source();
};

E2.p.prototype.reset = function()
{
	this.changed = true;
};

E2.p.prototype.play = function()
{
	if(this.audio_src && !this.playing)
	{
		this.should_play = true;
		this.updated = true;
	}
};

E2.p.prototype.pause = function()
{
	if(this.audio_src && this.playing)
	{
		this.playing = false;
		this.should_play = true;
		this.stop_playback();
		this.time = this.audio_src.currentTime;
		this.audio_src = null;
	}
};

E2.p.prototype.stop = function()
{
	console.log('stop audio')
	if(this.playing)
	{
		this.playing = this.should_play = false;
		this.stop_playback();
		this.audio_src = null;
	}
	
	this.time = 0.0;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(slot.index === 0)
	{
		if(!on && this.playing && this.node.outputs.length < 1)
		{
			this.stop_playback();
			this.audio_src = null;
			this.playing = false;
		}
	}		
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		if(data && data.toString() !== '[object AudioBuffer]')
		{
			msg('ERROR: Can\'t create audio source from buffer: The supplied object isn\'t a valid AudioBuffer object.');
			return;
		}
	
		if(this.playing)
		{
			if(this.audio_src)
				this.stop_playback();
			
			this.playing = false;
		}
		
		this.buffer = data;
		this.changed = true;
	}
	else if(slot.index === 1)
	{
		this.should_play = data;
		this.changed = true;
	}
	else if(slot.index === 2)
	{
		this.loop = data;
	}
	else if(slot.index === 3)
	{
		this.loop_start = data;
	}
	else if(slot.index === 4)
	{
		this.loop_end = data;
	}
};	

E2.p.prototype.start_playback = function()
{
	if(this.audio_src && this.audio_src.buffer !== null && this.state === 0)
	{
		this.audio_src.start(0);
		this.state++;
	}
};

E2.p.prototype.stop_playback = function()
{
	if(this.audio_src && this.state === 1)
	{
		this.audio_src.stop(0);
		this.state--;
	}
};

E2.p.prototype.update_source = function()
{
	if(!this.core.audio_ctx)
	{
		this.audio_src = null;
		return;
	}
	
	this.audio_src = this.core.audio_ctx.createBufferSource();
	this.audio_src.player = this;
	this.state = 0;
	
	if(this.buffer && this.playing)
		this.audio_src.buffer = this.buffer;
}

E2.p.prototype.update_state = function()
{
	if(this.changed)
	{
		if(this.playing !== this.should_play)
		{
			if(this.audio_src)
			{
				if(this.playing && !this.should_play)
					this.stop_playback();
			}
		
			this.playing = this.should_play;
			this.update_source();
		}

		this.changed = false;
	}

	if(this.audio_src)
	{
		if(this.audio_src.loop !== this.loop)
			this.audio_src.loop = this.loop;
		
		if(this.audio_src.loopStart !== this.loop_start)
			this.audio_src.loopStart = this.loop_start;
		
		if(this.audio_src.loopEnd !== this.loop_end)
			this.audio_src.loopEnd = this.loop_end;
		
		if(this.time !== null)
		{
			this.audio_src.currentTime = this.time;
			this.time = null;
		}
	}
};

E2.p.prototype.update_output = function(slot)
{
	return this.audio_src;
};
