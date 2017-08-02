E2.p = E2.plugins["module_player"] = function(core, node)
{
	this.desc = 'Play either a Protracker -compatible .MOD file, or a Scream Tracker 3 -compatible .S3M file, or a Fast Tracker 2 -compatible XM file by using library by Firehawk/TDA (firehawk@haxor.fi).';
	
	this.input_slots = [ 
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'The url of the module to play.', def: null },
		{ name: 'play', dt: core.datatypes.BOOL, desc: 'Send true to start playback and false to stop.', def: false },
	];
	
	this.output_slots = [
	]
	core.add_aux_script('module_player/utils.js');
	core.add_aux_script('module_player/ft2.js');
	core.add_aux_script('module_player/st3.js');
	core.add_aux_script('module_player/pt.js');
	core.add_aux_script('module_player/player.js', function(self) { return function()
	{
		self.player = new Modplayer();
	}}(this));

	this.audio = null;
	this.playing = false;
	this.should_play = false;
};

E2.p.prototype.play = function()
{
	if(this.audio && !this.playing && this.should_play)
	{
		this.playing = this.should_play = true;
		this.play();
	}
};

E2.p.prototype.pause = function()
{
	if(this.player && this.playing)
	{
		this.playing = false;
		this.should_play = true;
		player.pauseaudio();
	}
};

E2.p.prototype.stop = function()
{
	if(this.player)
	{
		if(this.playing)
		{
			this.stop();
		}
	}
};

E2.p.prototype.update_input = function(slot, data)
{
	if(slot.index === 0)
	{
		this.player.onReady=function() {
				this.play();
			}
		this.player.load(data);
		this.playing = true;
	}
	else if(slot.index === 1)
		this.should_play = data;
};

E2.p.prototype.update_state = function()
{
	var player = this;
	
	if(!this.player || !this.player.ready)
		return;
	
	if(this.playing !== this.should_play)
	{
		if(this.should_play)
			this.play();
		else
			this.pause();
		
		this.playing = this.should_play;
	}
	
	if(!this.playing)
		return;

	this.updated = true;
};
