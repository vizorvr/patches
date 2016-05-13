(function(){
var UrlAudio = E2.plugins["url_audio_generator"] = function(core, node)
{
	Plugin.apply(this, arguments)
	this.desc = 'Load a sample from an URL. Each sample should be encoded as .wav, .mp3, .mp4 and .ogg, and no extension should be specified. This plugin will load the appropriate filetype for the current execution environment. Hover over the Source button to see the url of the current file.';

	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: '' }
	];
	
	this.output_slots = [ 
		{ name: 'audio', dt: core.datatypes.AUDIO, desc: 'An audio stream.' }
	];
	
	this.state = { url: '' };
	this.core = core;
	this.audio = null;
	this.dirty = false;
};
UrlAudio.prototype = Object.create(Plugin.prototype)

UrlAudio.prototype.reset = function()
{
};

UrlAudio.prototype.create_ui = function()
{
	var inp = makeButton('Source', 'No audio selected.', 'url');
	var that = this;

	function clickHandler() {
		var oldValue = that.state.url
		var newValue = oldValue

		function setValue(v) {
			that.state.url = newValue = v
			that.updated = true
			that.state_changed()
		}

		FileSelectControl
		.createModelSelector('audio', oldValue, function(control) {
			control	
			.selected(oldValue)
			.onChange(setValue.bind(this))
			.buttons({
				'Cancel': setValue.bind(this, oldValue),
				'Select': setValue.bind(this)
			})
			.on('closed', function() {
				if (newValue === oldValue)
					return;
			
				that.undoableSetState('url', newValue, oldValue)

				E2.track({
					event: 'assetChanged',
					plugin: 'UrlAudio',
					url: newValue
				})
			})
			.modal()
		})
	}

	inp.click(clickHandler)
	return inp;
};

UrlAudio.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

UrlAudio.prototype.update_state = function()
{
	var that = this;

	if(!this.dirty)
		return;
	
	if (typeof(Audio) === 'undefined')
		return msg('Audio: This browser does not support the Audio API.');
	
	if (this.audio)
	{
		this.audio.pause();
		delete this.audio;
	}

	this.audio = new Audio();

	this.audio.loop = true;
	this.audio.preload = true;

	if (this.state.url)
	{
		this.audio.addEventListener('error', function()
		{
			msg('ERROR: Audio: Failed to load \'' + that.state.url + '\'.');
			that.state.url = '';
			that.audio = null;
		});
	
		msg('Audio: Loading ' + this.state.url + '.');
		this.audio.src = this.state.url;
	}
	
	this.dirty = false;
};

UrlAudio.prototype.update_output = function(slot)
{
	return this.audio;
};

UrlAudio.prototype.state_changed = function(ui)
{
	if (this.state.url) {
		if(ui)
			ui.attr('title', this.state.url);
		else
			this.dirty = true;
	}
};
})();
