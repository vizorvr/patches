E2.p = E2.plugins["url_video_generator"] = function(core, node)
{
	this.desc = 'Load a Ogg/Theora video from an URL.';
	
	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: '' }
	];
	
	this.output_slots = [ 
		{ name: 'video', dt: core.datatypes.VIDEO, desc: 'An video stream.' }
	];
	
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.core = core;
	this.URL_VIDEO_ROOT = 'data/video/';
	this.video = null;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = makeButton('Source', 'No video selected.', 'url');
	var self = this;

	inp.click(function()
	{
		FileSelectControl
			.createForUrl(self.URL_VIDEO_ROOT, self.state.url)
			.onChange(function(v)
			{
				if (v.indexOf('://') === -1)
					v = self.URL_VIDEO_ROOT + v;
				
				self.state.url = v;
				self.state_changed(null);
				self.state_changed(inp);
				self.updated = true;
			});
	});

	return inp;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

E2.p.prototype.update_output = function(slot)
{
	return this.video;
};

E2.p.prototype.state_changed = function(ui)
{
	if(this.state.url !== '')
	{
		if(ui)
			ui.attr('title', this.state.url);
		else
		{
			if(this.video !== null)
			{
				this.video.pause();
				delete this.video;
			}
			
			this.video = document.createElement('video');

			if(this.video !== 'undefined')
			{
				this.video.loop = true;
				this.video.preload = 'auto';
				this.video.controls = false;
				
				this.video.addEventListener('error', function(self) { return function(at) {
					msg('ERROR: Video: Failed to load \'' + self.state.url + '\'.');
					self.video = null;
					self.state.url = '';
				}}(this));
			
				msg('Video: Loading ' + this.state.url + '.');
				this.video.src = this.state.url;
			}
			else
			{
				msg('Video: This browser does not support the Video API.');
				this.video = null;
			}
		}
	}
};
