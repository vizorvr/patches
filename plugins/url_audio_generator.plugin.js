E2.plugins["url_audio_generator"] = function(core, node) {
	var self = this;
	
	this.desc = 'Load a sample from an URL. Each sample should be encoded as .wav, .mp3, .mp4 and .ogg, and no extension should be specified. This plugin will load the appropriate filetype for the current execution environment.';
	this.input_slots = [];
	this.output_slots = [ { name: 'audio', dt: core.datatypes.AUDIO } ];
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.audio = null;
	this.changed = true;
	
	this.reset = function()
	{
		// Retransmit the audio handle if we've been stopped.
		self.changed = true;
	};
	
	this.create_ui = function()
	{
		var inp = $('<input id="url" type="button" value="Source" title="No audio selected." />');
		
		inp.click(function(e) 
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
				self.changed = true;
				diag.dialog('close');
			};
			
			diag.dialog({
				width: 460,
				height: 150,
				modal: true,
				title: 'Select audio URL (no extension required).',
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
						if(e.keyCode == $.ui.keyCode.ENTER)
							done_func();
					});
				}
			});
		});
		
		return inp;
	};
	
	this.update_state = function(delta_t)
	{
		if(self.changed)
		{
			self.changed = false;
			self.updated = true;
		}
	};
	
	this.update_output = function(slot)
	{
		return self.audio;
	};
	
	this.state_changed = function(ui)
	{
		if(self.state.url !== '')
		{
			if(ui)
				ui.attr('title', self.state.url);
			else
			{
				if(typeof(Audio) !== 'undefined')
				{
					self.audio = new Audio();
				
					self.audio.loop = true;
					self.audio.preload = true;
				
					// Damn browser wars. Select file type based on cap sniffing.
					if(self.audio.canPlayType('audio/mp4; codecs="mp4a.40.2"'))
						self.audio.src = self.state.url + '.mp4';
					else if(self.audio.canPlayType('audio/ogg; codecs="vorbis"'))
						self.audio.src = self.state.url + '.ogg';
					else if(self.audio.canPlayType('audio/mpeg'))
						self.audio.src = self.state.url + '.mp3';
					else if(self.audio.canPlayType('audio/wav; codecs="1"'))
						self.audio.src = self.state.url + '.wav';
					else
						msg('URL Audio generator: This browser supports neither mp4, mp3, ogg vorbis or wav playback.');
				}
				else
					msg('URL Audio generator: This browser does not support the Audio API.');
			}
		}
	};
};
