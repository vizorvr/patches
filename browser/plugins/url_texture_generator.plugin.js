E2.p = E2.plugins["url_texture_generator"] = function(core, node)
{
	this.desc = 'Load a texture from an URL. JPEG and PNG supported. Hover over the Change button to see the url of the current file.';
	
	this.input_slots = [];
/*	this.input_slots = [
		{ name: 'url', dt: core.datatypes.TEXT, desc: 'Use this to load from a URL supplied as a string.', def: '' }
	];*/
	
	this.output_slots = [
		{ name: 'texture', dt: core.datatypes.TEXTURE, desc: 'The loaded texture.' }
	];
	
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.core = core;
	this.texture = null;
	this.dirty = false;
	this.thumbnail = null;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var container = make('div');
	var inp = makeButton('Change', 'No texture selected.', 'url');
	var self = this;

	this.thumbnail = make('div');
	
	this.thumbnail.css({
		'width': '71px',
		'height': '71px',
		'z-index': '3003',
		'border': '2px solid #8e8e8e',
		'border-radius': '5px',
		'background-image': 'url(\'images/no_texture.png\')',
		'background-size': 'cover',
		'margin-bottom': '3px'
  	});

	inp.click(function()
	{
		FileSelectControl
			.createTextureSelector(self.state.url)
			.onChange(function(v)
			{
				self.state.url = v;
				self.state_changed(null);
				self.state_changed(inp);
				self.updated = true;
			});
	});

  	container.append(this.thumbnail);
  	container.append(inp);

  	return container;
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

	this.texture = this.core.renderer.texture_cache.get(this.state.url);
	this.dirty = false;
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
		{
			ui.attr('title', this.state.url);
			this.thumbnail.css({ 'background-image': 'url(\'' + this.state.url + '\')' });
		}
		else
			this.dirty = true;
	}
};
