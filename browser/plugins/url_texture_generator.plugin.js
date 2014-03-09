var URL_TEXTURES_ROOT = 'data/textures/'

E2.p = E2.plugins["url_texture_generator"] = function(core, node)
{
	this.desc = 'Load a texture from an URL. JPEG and PNG supported. Hover over the Source button to see the url of the current file.';
	
	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.' }
	];
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The loaded texture.' }
	];
	
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.core = core;
	this.texture = null;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var self = this

	var inp = $('<input id="url" type="button" value="Source" title="No texture selected." />');
	
	inp.click(function()
	{
		$.get(URL_TEXTURES_ROOT, function(files)
		{
			files = files.map(function(n) {
				return {
					name: URL_TEXTURES_ROOT + n
				}
			})

			new FileSelectControl()
				.buttons({
					'Download': function(file) {},
					'Upload': function() {},
					'Cancel': function() {},
					'Open': function() {}
				})
				.files(files)
				.selected(self.state.url)
				.onChange(function(v) {
					self.state.url = v;
					self.state_changed(null);
					self.state_changed(inp);
					self.updated = true;
				})
				.modal()
		})
	})

	return inp;
};

E2.p.prototype.update_input = function(slot, data)
{
	this.state.url = data;
	this.state_changed(null);
};

E2.p.prototype.update_output = function(slot)
{
	return this.texture;
};

E2.p.prototype.state_changed = function(ui)
{
	if(this.state.url !== '')
	{
		if(ui)
			ui.attr('title', this.state.url);
		else
			this.texture = this.core.renderer.texture_cache.get(this.state.url);
	}
};
