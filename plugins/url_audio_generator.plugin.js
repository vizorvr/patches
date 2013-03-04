E2.p = E2.plugins["url_audio_generator"] = function(core, node)
{
	this.desc = 'Load a sample from an URL. Each sample should be encoded as .wav, .mp3, .mp4 and .ogg, and no extension should be specified. This plugin will load the appropriate filetype for the current execution environment. Hover over the Source button to see the url of the current file.';
	this.input_slots = [];
	this.output_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'An audio stream.' }
	];
	
	this.state = { url: '' };
	this.audio = null;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<input id="url" type="button" value="Source" title="No audio selected." />');
	
	inp.click(function(self) { return function(e) 
	{
		var url = self.state.url;
		
		if(url === '')
			url = 'data/audio/';
		
		var diag = make('div');
		var url_inp = $('<input type="input" value="' + url + '" />'); 
		
		url_inp.css('width', '410px');
		diag.append(url_inp);
		
		var done_func = function()
		{
			var u = url_inp.val();

			self.state.url = u.substr(0, u.lastIndexOf('.')) || u;
			self.state_changed(null);
			self.state_changed(inp);
			self.updated = true;
			diag.dialog('close');
		};
		
		diag.dialog({
			width: 460,
			height: 150,
			modal: true,
			title: 'Select audio URL (no extension).',
			show: 'slide',
			hide: 'slide',
			buttons: {
				'OK': function()
				{
					done_func();
				},
				'Cancel': function()
				{
					$(this).dialog('close');
				}
			},
			open: function()
			{
				url_inp.focus().val(url_inp.val());
				diag.keyup(function(e)
				{
					if(e.keyCode === $.ui.keyCode.ENTER)
						done_func();
				});
			}
		});
	}}(this));
	
	return inp;
};

E2.p.prototype.update_output = function(slot)
{
	return this.audio;
};

E2.p.prototype.state_changed = function(ui)
{
	if(this.state.url !== '')
	{
		if(ui)
			ui.attr('title', this.state.url);
		else
		{
			if(typeof(Audio) !== 'undefined')
			{
				if(this.audio !== null)
				{
					this.audio.pause();
					delete this.audio;
				}
			
				var src = null;

				this.audio = new Audio();
			
				this.audio.loop = true;
				this.audio.preload = true;
			
				// Select file type based on cap sniffing.
				if(this.audio.canPlayType('audio/ogg; codecs="vorbis"'))
					src = this.state.url + '.ogg';
				else if(this.audio.canPlayType('audio/mpeg'))
					src = this.state.url + '.mp3';
				else
					msg('Audio: This browser supports neither ogg vorbis or mp3 audio playback.');

				if(src !== null)
				{
					this.audio.addEventListener('error', function(self, src) { return function(at) {
						msg('ERROR: Audio: Failed to load \'' + src + '\'.');
						self.audio = null;
					}}(this, src));
				
					msg('Audio: Loading ' + src + '.');
					this.audio.src = src;
				}
			}
			else
				msg('Audio: This browser does not support the Audio API.');
		}
	}
};
