E2.p = E2.plugins["url_audio_buffer_generator"] = function(core, node)
{
	this.desc = 'Load an audio sample from an URL.';

	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: '' }
	];
	
	this.output_slots = [ 
		{ name: 'buffer', dt: core.datatypes.OBJECT, desc: 'An audio buffer.' }
	];
	
	this.state = { url: '' };
	this.core = core;
	this.buffer = null;
	this.dirty = false;
};

E2.p.prototype.reset = function()
{
	this.updated = false;
};

E2.p.prototype.create_ui = function()
{
	var inp = makeButton('Source', 'No audio selected.', 'url');
	var self = this;

	inp.click(function()
	{
		FileSelectControl
			.createAudioSelector(self.state.url)
			.onChange(function(v)
			{
				self.state.url = v;
				self.state_changed(null);
				self.state_changed(inp);
			});
	});

	return inp;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

E2.p.prototype.update_state = function()
{
	if(!this.dirty)
		return;
	
	if(this.core.audio_ctx)
	{
		var req = new XMLHttpRequest();
		
		req.open('GET', this.state.url, true);
		req.responseType = 'arraybuffer';
		this.core.asset_tracker.signal_started();
		
		req.onload = function(self) { return function()
		{
			self.core.audio_ctx.decodeAudioData(req.response, function(self) { return function(buffer)
			{
				self.buffer = buffer;
				self.updated = true;
				self.core.asset_tracker.signal_completed();
			}}(self), msg);
		}}(this);
		
		req.send();
	}
	else
		msg('ERROR: Cannot create audio buffer. This browser does not support the required API.');

	this.dirty = false;
};

E2.p.prototype.update_output = function(slot)
{
	return this.buffer;
};

E2.p.prototype.state_changed = function(ui)
{
	if(this.state.url !== '')
	{
		if(ui)
			ui.attr('title', this.state.url);
		else
			this.dirty = true;
	}
};
