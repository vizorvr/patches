E2.p = E2.plugins["video_player"] = function(core, node)
{
	this.desc = 'Play a video stream. Playback loops by default.';
	
	this.input_slots = [ 
		{ name: 'video', dt: core.datatypes.VIDEO, desc: 'The video stream to play.', def: null },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Send true to start playback and false to stop.', def: false },
		{ name: 'muted', dt: core.datatypes.BOOL, desc: 'Is audio muted?', def: true },
		{ name: 'volume', dt: core.datatypes.FLOAT, desc: 'Set playback volume.', lo: 0.0, hi: 0.0, def: 0.5 },
		{ name: 'time', dt: core.datatypes.FLOAT, desc: 'Set playback time.', def: 0.0 }
	];
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The current video frame.' }
	]
	
	this.core = core;
	this.node = node;
	this.video = null;
	this.playing = false;
	this.should_play = false;
	this.muted = true;
	this.volume = 0.5;
	this.time = null;
	this.texture = null;
};

E2.p.prototype.play = function()
{
	if(this.video && !this.playing && this.should_play)
	{
		this.playing = this.should_play = true;
		this.video.play();
	}
};

E2.p.prototype.pause = function()
{
	if(this.video && this.playing)
	{
		this.playing = false;
		this.should_play = true;
		this.video.pause();
	}
};

E2.p.prototype.stop = function()
{
	if(this.video)
	{
		if(this.playing)
		{
			this.playing = this.should_play = false;
			this.video.pause();
		}
		
		if(this.video.readyState >= 2)
			this.video.currentTime = 0;
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		this.video = data;
		this.texture = null;
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
	var video = this.video;
	
	if(!video || video.readyState < 2)
		return;
	
	if(this.playing !== this.should_play)
	{
		if(video)
		{
			if(this.should_play)
				video.play();
			else
				video.pause();
			
			this.playing = this.should_play;
		}
		
	}
	
	if(!this.playing)
		return;

	if(video)
	{
		if(video.videoWidth > 0 && video.videoHeight > 0)
		{
			if(!this.texture)
				this.texture = new Texture(this.core.renderer);
			
			this.texture.upload(video);
		}
		
		video.muted = this.muted;
		video.volume = this.volume;
		
		if(this.time && video.readyState >= 2)
		{
			video.currentTime = this.time;
			this.time = null;
		}
	}

	this.updated = true;
};

E2.p.prototype.update_output = function(slot)
{
	this.node.queued_update = 1;
	return this.texture ? this.texture : this.core.renderer.default_tex;
};

