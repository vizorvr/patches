g_Plugins["url_texture_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'texture', dt: core.datatypes.TEXTURE } ];
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.texture = null;
	
	this.reset = function(ui)
	{
		self.reload();
	};
	
	this.create_ui = function()
	{
		var inp = $('<input type="button" value="Source" title="No texture selected." />');
		
		inp.click(function(e) 
		{
			var url = document.URL;
			
			if(url[url.length-1] !== '/')
				url = url.substring(0, url.lastIndexOf('/') + 1);
			
			var diag = make('div');
			var url_inp = $('<input type="input" value="' + url + 'data/textures/" />'); 
			
			url_inp.css('width', '400px');
			diag.append(url_inp);
			
			diag.dialog({
				width: 420,
				height: 150,
				modal: true,
				title: 'Select image URL.',
				buttons: {
					'OK': function()
					{
						self.state.url = url_inp.val();
						self.reload();
						$(this).dialog('close');
						inp.attr('title', self.state.url);
					},
					'Cancel': function()
					{
						$(this).dialog('close');
					}
				}
			});
		});
		
		return inp;
	};
	
	this.update_output = function(index)
	{
		return self.texture;
	};
	
	this.reload = function()
	{
		if(self.state.url !== '')
		{
			self.texture = new Texture(self.gl);	
			self.texture.load(self.state.url);
		}
	};
};
