E2.p = E2.plugins["url_video_generator"] = function(core, node)
{
	this.desc = 'Load a Ogg/Theora video from an URL.';
	
	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.' }
	];
	
	this.output_slots = [ 
		{ name: 'video', dt: core.datatypes.VIDEO, desc: 'An video stream.' }
	];
	
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.core = core;
	this.video = null;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<input id="url" type="button" value="Source" title="No video selected." />');
	
	inp.click(function(self, inp) { return function(e) 
	{
		var url = self.state.url;
		
		if(url === '')
			url = 'data/video/';
		
		var diag = make('div');
		var url_inp = $('<input type="input" value="' + url + '" />'); 
		
		url_inp.css({
			'width': '410px',
			'border': '1px solid #999'
		});
		
		diag.append(url_inp);
		
		var done_func = function(self, url_inp, diag, inp) { return function(e)
		{
			self.state.url = url_inp.val();
			self.state.url = self.state.url === 'data/video/' ? '' : self.state.url;
			self.state_changed(null);
			self.state_changed(inp);
			self.updated = true;

			if(self.state.url === '')
				inp.attr('title', 'No video selected.');
		}}(self, url_inp, diag, inp);
		
		var open_func = function(url_inp) { return function()
		{
			url_inp.focus().val(url_inp.val());
		}}(url_inp);
		
		self.core.create_dialog(diag, 'Select video URL.', 445, 155, done_func, open_func);
	}}(this, inp));
	
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
