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
	this.changed = true;
};

E2.p.prototype.reset = function()
{
	// Retransmit the texture handle if we've been stopped.
	this.changed = true;
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<input id="url" type="button" value="Source" title="No texture selected." />');
	
	inp.click(function(self) { return function(e) 
	{
		var url = self.state.url;
		
		if(url === '')
			url = 'data/textures/';
		
		var diag = make('div');
		var url_inp = $('<input type="input" value="' + url + '" />'); 
		
		url_inp.css('width', '410px');
		diag.append(url_inp);
		
		var done_func = function()
		{
			self.state.url = url_inp.val();
			self.state_changed(null);
			self.state_changed(inp);
			
			if(self.state.url === '')
				inp.attr('title', 'No texture selected.');

			self.changed = true;
			diag.dialog('close');
		};
		
		diag.dialog({
			width: 460,
			height: 150,
			modal: true,
			title: 'Select image URL.',
			show: 'slide',
			hide: 'slide',
			buttons: {
				'OK': function()
				{
					done_func();
				},
				'Cancel': function()
				{
					$(this).dialog('close');
				}
			},
			open: function()
			{
				url_inp.focus().val(url_inp.val());
				diag.keyup(function(e)
				{
					if(e.keyCode === $.ui.keyCode.ENTER)
						done_func();
				});
			}
		});
	}}(this));
	
	return inp;
};

E2.p.prototype.update_state = function(delta_t)
{
	if(this.changed)
	{
		this.changed = false;
		this.updated = true;
	}
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
