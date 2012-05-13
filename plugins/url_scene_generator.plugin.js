E2.plugins["url_scene_generator"] = function(core, node) {
	var self = this;
	var gl = core.renderer.context;
	
	this.desc = 'Load a scene from an URL.';
	this.input_slots = [];
	this.output_slots = [ { name: 'scene', dt: core.datatypes.SCENE } ];
	this.state = { url: '' };
	this.scene = null;
	this.changed = true;
	
	this.reset = function()
	{
		// Retransmit the scene handle if we've been stopped.
		self.changed = true;
	};
	
	this.create_ui = function()
	{
		var inp = $('<input id="url" type="button" value="Source" title="No scene selected." />');
		
		inp.click(function(e) 
		{
			var url = self.state.url;
			
			if(url === '')
			{
				url = document.URL;
				
				if(url[url.length-1] !== '/')
					url = url.substring(0, url.lastIndexOf('/') + 1);
				
				url = url + 'data/scenes/';
			}
			
			var diag = make('div');
			var url_inp = $('<input type="input" value="' + url + '" />'); 
			
			url_inp.css('width', '410px');
			diag.append(url_inp);
			
			var done_func = function()
			{
				self.state.url = url_inp.val();
				self.state_changed(null);
				self.state_changed(inp);
				self.changed = true;
				diag.dialog('close');
			};
			
			diag.dialog({
				width: 460,
				height: 150,
				modal: true,
				title: 'Select scene URL.',
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
						if(e.keyCode == $.ui.keyCode.ENTER)
							done_func();
					});
				}
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
		return self.scene;
	};
	
	this.state_changed = function(ui)
	{
		if(self.state.url !== '')
		{
			if(ui)
				ui.attr('title', self.state.url);
			else
				self.scene = Scene.load(gl, self.state.url);
		}
	};
};
