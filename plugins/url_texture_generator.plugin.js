E2.plugins["url_texture_generator"] = function(core, node) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'texture', dt: core.datatypes.TEXTURE } ];
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.texture = null;
	this.changed = true;
	
	this.reset = function()
	{
		// Retransmit the texture handle if we've been stopped.
		self.changed = true;
	};
	
	this.create_ui = function()
	{
		var inp = $('<input id="url" type="button" value="Source" title="No texture selected." />');
		
		inp.click(function(e) 
		{
			var url = self.state.url;
			
			if(url === '')
			{
				url = document.URL;
				
				if(url[url.length-1] !== '/')
					url = url.substring(0, url.lastIndexOf('/') + 1);
				
				url = url + 'data/textures/';
			}
			
			var diag = make('div');
			var url_inp = $('<input type="input" value="' + url + '" />'); 
			
			url_inp.css('width', '410px');
			diag.append(url_inp);
			
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
						self.state.url = url_inp.val();
						self.state_changed(null);
						self.state_changed(inp);
						self.changed = true;
						$(this).dialog('close');
					},
					'Cancel': function()
					{
						$(this).dialog('close');
					}
				},
				open: function(url) { return function()
				{
					url.focus().val(url.val());
				}}(url_inp)
			});
		});
		
		return inp;
	};
	
	this.update_state = function(delta_t)
	{
		if(self.changed)
		{
			self.changed = false;
			self.updated = true;
		}
	};
	
	this.update_output = function(slot)
	{
		return self.texture;
	};
	
	this.state_changed = function(ui)
	{
		if(self.state.url !== '')
		{
			if(ui)
				ui.attr('title', self.state.url);
			else
			{
				self.texture = new Texture(self.gl);	
				self.texture.load(self.state.url);
			}
		}
	};
};
