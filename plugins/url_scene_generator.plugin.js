E2.p = E2.plugins["url_scene_generator"] = function(core, node)
{
	this.desc = 'Load a scene from an URL. Hover over the Source button to see the url of the current file.';
	this.input_slots = [];
	this.output_slots = [
		{ name: 'scene', dt: core.datatypes.SCENE, desc: 'The loaded scene if one has been selected.' }
	];
	
	this.state = { url: '' };
	this.core = core;
	this.scene = null;
};

E2.p.prototype.reset = function()
{
};

E2.p.prototype.create_ui = function()
{
	var inp = $('<input id="url" type="button" value="Source" title="No scene selected." />');
	
	inp.click(function(self, inp) { return function(e) 
	{
		var url = self.state.url;
		
		if(url === '')
			url = 'data/scenes/';
		
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
			self.updated = true;
			diag.dialog('close');
		}}(self, url_inp, diag, inp);
		
		var open_func = function(url_inp) { return function()
		{
			url_inp.focus().val(url_inp.val());
		}}(url_inp);
		
		self.core.create_dialog(diag, 'Select scene URL.', 445, 155, done_func, open_func);
	}}(this, inp));
	
	return inp;
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
			this.scene = Scene.load(this.core.renderer.context, this.state.url, this.core);
	}
};
