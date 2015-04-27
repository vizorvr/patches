(function() {

var UrlVideo = E2.plugins["url_video_generator"] = function UrlVideo(core, node) {
	AbstractPlugin.apply(this, arguments)
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
	this.dirty = false;
}
UrlVideo.prototype = Object.create(AbstractPlugin.prototype)

UrlVideo.prototype.reset = function() {}

UrlVideo.prototype.create_ui = function()
{
	var inp = makeButton('Source', 'No video selected.', 'url');
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
		.createModelSelector('video', oldValue, function(control) {
			control	
			.selected(oldValue)
			.onChange(setValue.bind(this))
			.buttons({
				'Cancel': setValue.bind(this),
				'Select': setValue.bind(this)
			})
			.on('closed', function() {
				if (newValue === oldValue)
					return;
			
				that.undoableSetState('url', newValue, oldValue)
			})
			.modal()
		})
	}

	inp.click(clickHandler)

	return inp;
};

UrlVideo.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

UrlVideo.prototype.update_state = function()
{
	if(!this.dirty)
		return;
	
	if(this.video !== null)
	{
		this.video.pause();
		delete this.video;
	}

	this.video = document.createElement('video');
	this.video.crossOrigin = "Anonymous";

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
	
	this.dirty = false;
};

UrlVideo.prototype.update_output = function(slot)
{
	return this.video;
};

UrlVideo.prototype.state_changed = function(ui) {
	if (this.state.url !== '') {
		if (ui)
			ui.attr('title', this.state.url)

		this.dirty = true
	}
};

})();
