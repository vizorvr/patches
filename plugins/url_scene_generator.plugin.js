E2.p = E2.plugins["url_scene_generator"] = function(core, node)
{
	this.desc = 'Load a scene from an URL. Hover over the Source button to see the url of the current file.';
	this.input_slots = [];
	this.output_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The loaded scene if one has been selected.' }
	];
	
	this.state = { url: '' };
	this.gl = core.renderer.context;
	this.scene = null;
	this.changed = true;
};

E2.p.prototype.reset = function()
{
	// Retransmit the scene handle if we've been stopped.
	this.changed = true;
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<input id="url" type="button" value="Source" title="No scene selected." />');
	
	inp.click(function(self) { return function(e) 
	{
		var url = self.state.url;
		
		if(url === '')
			url = 'data/scenes/';
		
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
	return this.scene;
};

E2.p.prototype.state_changed = function(ui)
{
	if(this.state.url !== '')
	{
		if(ui)
			ui.attr('title', this.state.url);
		else
			this.scene = Scene.load(this.gl, this.state.url);
	}
};
