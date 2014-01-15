E2.p = E2.plugins["url_texture_generator"] = function(core, node)
{
	this.desc = 'Load a texture from an URL. JPEG and PNG supported. Hover over the Source button to see the url of the current file.';
	
	this.input_slots = [];
	
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
	var inp = $('<input id="url" type="button" value="Source" title="No texture selected." />');
	
	inp.click(function(self, inp) { return function(e) 
	{
		var url = self.state.url;
		
		if(url === '')
			url = 'data/textures/';
		
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
			self.state_changed(null);
			self.state_changed(inp);
			
			if(self.state.url === '')
				inp.attr('title', 'No texture selected.');

			self.updated = true;
			diag.dialog('close');
		}}(self, url_inp, diag, inp);
		
		
		var open_func = function(url_inp) { return function()
		{
			url_inp.focus().val(url_inp.val());
		}}(url_inp);
		
		self.core.create_dialog(diag, 'Select image URL.', 445, 155, done_func, open_func);
	}}(this, inp));
	
	return inp;
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
