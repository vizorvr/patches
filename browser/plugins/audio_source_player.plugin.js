E2.p = E2.plugins["audio_source_player"] = function(core, node)
{
	this.desc = 'Plays a supplied audio source.';
	
	this.input_slots = [ 
		{ name: 'source', dt: core.datatypes.OBJECT, desc: 'The audio source to play.', def: null }
	];
	
	this.output_slots = [
	]
	
	this.core = core;
	this.node = node;
	this.audio_src = null;
};

E2.p.prototype.connection_changed = function(on, conn, slot)
{
	if(!on && this.audio_src)
	{
		this.audio_src.player.stop_playback();
		this.audio_src = null;
	}		
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		if(data && (!data.context || data.context.toString() !== '[object AudioContext]'))
		{
			msg('ERROR: Can\'t play audio source: The supplied object isn\'t a valid AudioSource object.');
			return;
		}
		
		if(!data && this.audio_src && this.audio_src.buffer)
		{
			this.audio_src.player.stop_playback();
			return;
		}

		if(this.audio_src && this.audio_src !== data)
			this.audio_src.player.stop_playback();
		
		if(this.core.audio_ctx && this.audio_src !== data && data)
		{
			data.connect(this.core.audio_ctx.destination);
			
			if(data.player)
				data.player.start_playback();
		}

		this.audio_src = data;
	}
};

E2.p.prototype.update_state = function()
{
	this.updated = true;
};
