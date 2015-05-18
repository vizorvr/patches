(function() {
var UrlArray = E2.plugins["url_array_generator"] = function(core, node)
{
	Plugin.apply(this, arguments)
	this.desc = 'Load arbitrary data packed in an PNG from an URL.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The loaded array.' }
	];
	
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.core = core;
	this.array = null;
	this.dirty = false;
};
UrlArray.prototype = Object.create(Plugin.prototype)

UrlArray.prototype.reset = function()
{
};

UrlArray.prototype.create_ui = function()
{
	var inp = makeButton('Source', 'No texture selected.', 'url');
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
		.createTextureSelector(oldValue, function(control) {
			control	
			.template('texture')
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

UrlArray.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

UrlArray.prototype.update_state = function()
{
	if(!this.dirty)
		return;
		
	this.img = new Image();
	this.core.asset_tracker.signal_started();

	this.img.onload = function()
	{
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		
		canvas.width = this.img.width;
		canvas.height = this.img.height;
		
		ctx.imageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.globalCompositeOperation = 'copy';
		
		ctx.drawImage(this.img, 0, 0);
	
		var pd = ctx.getImageData(0, 0, this.img.width, this.img.height);
		
		this.array = pd.data.buffer;
		this.array.stride = 1;
		this.array.datatype = 1;
		this.updated = true;

		msg('INFO: Finished loading data array from ' + this.img.src);
		
		this.core.asset_tracker.signal_completed();
	}.bind(this);

	this.img.onerror = function()
	{
		this.core.asset_tracker.signal_failed();
	}.bind(this);

	this.img.onabort = function()
	{
		this.core.asset_tracker.signal_failed();
	}.bind(this);

	this.img.src = this.state.url;		
	this.dirty = false;
};

UrlArray.prototype.update_output = function(slot)
{
	return this.array;
};

UrlArray.prototype.state_changed = function(ui)
{
	if(this.state.url !== '')
	{
		if(ui)
			ui.attr('title', this.state.url);
		else
			this.dirty = true;
	}
};

})();
