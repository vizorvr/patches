E2.p = E2.plugins["url_array_generator"] = function(core, node)
{
	this.desc = 'Load arbitrary data packed in an PNG from an URL.';
	
	this.input_slots = [];
	
	this.output_slots = [
		{ name: 'array', dt: core.datatypes.ARRAY, desc: 'The loaded array.' }
	];
	
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.core = core;
	this.URL_TEXTURES_ROOT = 'data/textures/';
	this.array = null;
	this.dirty = false;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = makeButton('Source', 'No texture selected.', 'url');
	var self = this;
	
	inp.click(function()
	{
		FileSelectControl
			.createForUrl(self.URL_TEXTURES_ROOT, self.state.url)
			.onChange(function(v)
			{
				if (v.indexOf('://') === -1)
					v = self.URL_TEXTURES_ROOT + v;
				
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

E2.p.prototype.update_state = function()
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

E2.p.prototype.update_output = function(slot)
{
	return this.array;
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
