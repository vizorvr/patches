g_Plugins["url_texture_generator"] = function(core) {
	var self = this;
	
	this.input_slots = [];
	this.output_slots = [ { name: 'texture', dt: core.datatypes.TEXTURE } ];
	this.state = { texture: null, url: '' };
	this.gl = core.renderer.context;
	
	this.create_ui = function()
	{
		var inp = $('<input type="button" value="Source" title="No texture selected." />');
		
		inp.click(function(e) 
		{
			var diag = make('div');
			var url_inp = $('<input type="input" value="' + document.URL + 'data/textures/" />'); 
			
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
	
	this.update_state = function()
	{
	};
	
	this.update_output = function(index)
	{
		return self.state.texture;
	};
	
	this.reload = function()
	{
		var st = self.state;
		
		st.texture = new Texture(self.gl);
		
		st.texture.load(st.url);
	};
};
